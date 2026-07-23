import type {
  ILoadOptionsFunctions,
  INodeListSearchResult,
  INodePropertyOptions,
} from 'n8n-workflow';
import {
  getCredentialType,
  handleResendApiError,
  RESEND_API_BASE,
} from '../transport';

type ResendListResponseBody<T> = { data?: T[] };

type ResendDropdownItem = { id: string; name?: string };
type ResendContactItem = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};
type ResendWebhookItem = { id: string; endpoint?: string; status?: string };
type ResendEmailItem = { id: string; subject?: string; created_at?: string };
type ResendTemplateVariable = { key: string; type?: string };

type ResendTemplateDetailBody = { variables?: ResendTemplateVariable[] };

async function loadDropdownOptions(
  loadOptionsFunctions: ILoadOptionsFunctions,
  endpoint: string,
): Promise<INodePropertyOptions[]> {
  let response: ResendListResponseBody<ResendDropdownItem> | undefined;
  try {
    response =
      await loadOptionsFunctions.helpers.httpRequestWithAuthentication.call(
        loadOptionsFunctions,
        getCredentialType(loadOptionsFunctions),
        {
          url: `${RESEND_API_BASE}${endpoint}`,
          method: 'GET',
          qs: { limit: 100 },
          json: true,
        },
      );
  } catch (error) {
    handleResendApiError(loadOptionsFunctions.getNode(), error);
  }

  const items = response?.data ?? [];
  return items
    .filter((item) => item?.id)
    .map((item) => ({
      name: item.name ? `${item.name} (${item.id})` : item.id,
      value: item.id,
    }));
}

export async function getTemplateVariables(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  const getStringValue = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value : undefined;
  const safeGet = (getter: () => unknown) => {
    try {
      return getter();
    } catch {
      return undefined;
    }
  };
  const getParameterValue = (name: string): string | undefined => {
    const currentParameters = this.getCurrentNodeParameters();

    const paramValue = currentParameters?.[name];
    if (paramValue && typeof paramValue === 'object' && 'value' in paramValue) {
      return getStringValue((paramValue as { value: unknown }).value);
    }

    const fromCurrentParameters = getStringValue(paramValue);
    if (fromCurrentParameters) {
      return fromCurrentParameters;
    }

    const fromCurrentNodeParameter = getStringValue(
      safeGet(() => this.getCurrentNodeParameter(name)),
    );
    if (fromCurrentNodeParameter) {
      return fromCurrentNodeParameter;
    }

    const fromNodeParameter = getStringValue(
      safeGet(() => this.getNodeParameter(name, '')),
    );
    if (fromNodeParameter) {
      return fromNodeParameter;
    }

    return undefined;
  };

  const templateId =
    getParameterValue('emailTemplateId') ??
    getParameterValue('emailTemplateIdDropdown') ??
    getParameterValue('emailTemplateIdManual') ??
    getParameterValue('templateId') ??
    getParameterValue('templateIdDropdown') ??
    getParameterValue('templateIdManual');
  if (!templateId) {
    return [];
  }
  const normalizedTemplateId = templateId.trim();
  if (
    normalizedTemplateId.startsWith('={{') ||
    normalizedTemplateId.includes('{{')
  ) {
    return [];
  }

  let response: ResendTemplateDetailBody | undefined;
  try {
    response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      getCredentialType(this),
      {
        url: `${RESEND_API_BASE}/templates/${encodeURIComponent(normalizedTemplateId)}`,
        method: 'GET',
        json: true,
      },
    );
  } catch (error) {
    handleResendApiError(this.getNode(), error);
  }

  const variables = response?.variables ?? [];

  return variables
    .filter((variable) => variable?.key)
    .map((variable) => {
      const typeLabel = variable.type ? ` (${variable.type})` : '';
      return {
        name: `${variable.key}${typeLabel}`,
        value: variable.key,
      };
    });
}

export async function getTemplates(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  return loadDropdownOptions(this, '/templates');
}

export async function getSegments(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  return loadDropdownOptions(this, '/segments');
}

type ResendSuppressionItem = { id: string; email?: string };

export async function getSuppressions(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  let response: ResendListResponseBody<ResendSuppressionItem> | undefined;
  try {
    response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      getCredentialType(this),
      {
        url: `${RESEND_API_BASE}/suppressions`,
        method: 'GET',
        qs: { limit: 100 },
        json: true,
      },
    );
  } catch (error) {
    handleResendApiError(this.getNode(), error);
  }

  const items = response?.data ?? [];
  return items
    .filter((item) => item?.id)
    .map((item) => ({
      name: item.email ? `${item.email} (${item.id})` : item.id,
      value: item.id,
    }));
}

export async function getTopics(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  return loadDropdownOptions(this, '/topics');
}

export async function getBroadcasts(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  return loadDropdownOptions(this, '/broadcasts');
}

export async function getContacts(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  let response: ResendListResponseBody<ResendContactItem> | undefined;
  try {
    response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      getCredentialType(this),
      {
        url: `${RESEND_API_BASE}/contacts`,
        method: 'GET',
        qs: { limit: 100 },
        json: true,
      },
    );
  } catch (error) {
    handleResendApiError(this.getNode(), error);
  }

  const items = response?.data ?? [];
  return items
    .filter((item) => item?.id)
    .map((item) => {
      const displayParts: string[] = [];
      if (item.first_name || item.last_name) {
        displayParts.push(
          [item.first_name, item.last_name].filter(Boolean).join(' '),
        );
      }
      if (item.email) {
        displayParts.push(item.email);
      }
      const displayName =
        displayParts.length > 0
          ? `${displayParts.join(' - ')} (${item.id})`
          : item.id;
      return {
        name: displayName,
        value: item.id,
      };
    });
}

export async function getDomains(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  return loadDropdownOptions(this, '/domains');
}

export async function getWebhooks(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  let response: ResendListResponseBody<ResendWebhookItem> | undefined;
  try {
    response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      getCredentialType(this),
      {
        url: `${RESEND_API_BASE}/webhooks`,
        method: 'GET',
        qs: { limit: 100 },
        json: true,
      },
    );
  } catch (error) {
    handleResendApiError(this.getNode(), error);
  }

  const items = response?.data ?? [];
  return items
    .filter((item) => item?.id)
    .map((item) => {
      let displayName = item.id;
      if (item.endpoint) {
        const shortEndpoint =
          item.endpoint.length > 50
            ? `${item.endpoint.substring(0, 47)}...`
            : item.endpoint;
        const statusLabel = item.status ? ` [${item.status}]` : '';
        displayName = `${shortEndpoint}${statusLabel} (${item.id})`;
      }
      return { name: displayName, value: item.id };
    });
}

export async function getContactProperties(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  return loadDropdownOptions(this, '/contact-properties');
}

export async function getEmails(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  let response: ResendListResponseBody<ResendEmailItem> | undefined;
  try {
    response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      getCredentialType(this),
      {
        url: `${RESEND_API_BASE}/emails`,
        method: 'GET',
        qs: { limit: 100 },
        json: true,
      },
    );
  } catch (error) {
    handleResendApiError(this.getNode(), error);
  }

  const items = response?.data ?? [];
  return items
    .filter((item) => item?.id)
    .map((item) => {
      const parts: string[] = [];
      if (item.subject) {
        parts.push(
          item.subject.length > 50
            ? `${item.subject.substring(0, 47)}...`
            : item.subject,
        );
      }
      if (item.created_at) {
        const date = new Date(item.created_at);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        parts.push(`${day}/${month}/${year}`);
      }
      const displayName =
        parts.length > 0 ? `${parts.join(' - ')} (${item.id})` : item.id;
      return { name: displayName, value: item.id };
    });
}

export async function getReceivedEmails(
  this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
  let response: ResendListResponseBody<ResendEmailItem> | undefined;
  try {
    response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      getCredentialType(this),
      {
        url: `${RESEND_API_BASE}/emails/receiving`,
        method: 'GET',
        qs: { limit: 100 },
        json: true,
      },
    );
  } catch (error) {
    handleResendApiError(this.getNode(), error);
  }

  const items = response?.data ?? [];
  return items
    .filter((item) => item?.id)
    .map((item) => {
      const parts: string[] = [];
      if (item.subject) {
        parts.push(
          item.subject.length > 50
            ? `${item.subject.substring(0, 47)}...`
            : item.subject,
        );
      }
      if (item.created_at) {
        const date = new Date(item.created_at);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        parts.push(`${day}/${month}/${year}`);
      }
      const displayName =
        parts.length > 0 ? `${parts.join(' - ')} (${item.id})` : item.id;
      return { name: displayName, value: item.id };
    });
}

async function wrapForListSearch(
  loadOptionsFunctions: ILoadOptionsFunctions,
  loadOptionsMethod: () => Promise<INodePropertyOptions[]>,
  filter?: string,
): Promise<INodeListSearchResult> {
  const options = await loadOptionsMethod.call(loadOptionsFunctions);

  let filteredOptions = options;
  if (filter) {
    const filterLower = filter.toLowerCase();
    filteredOptions = options.filter(
      (option) =>
        option.name.toLowerCase().includes(filterLower) ||
        option.value.toString().toLowerCase().includes(filterLower),
    );
  }

  return {
    results: filteredOptions.map((option) => ({
      name: option.name,
      value: option.value,
    })),
  };
}

function createListSearch(
  loadOptionsMethod: (
    this: ILoadOptionsFunctions,
  ) => Promise<INodePropertyOptions[]>,
): (
  this: ILoadOptionsFunctions,
  filter?: string,
) => Promise<INodeListSearchResult> {
  return function (this: ILoadOptionsFunctions, filter?: string) {
    return wrapForListSearch(this, loadOptionsMethod, filter);
  };
}

export const getBroadcastsListSearch = createListSearch(getBroadcasts);
export const getContactPropertiesListSearch =
  createListSearch(getContactProperties);
export const getContactsListSearch = createListSearch(getContacts);
export const getDomainsListSearch = createListSearch(getDomains);
export const getEmailsListSearch = createListSearch(getEmails);
export const getReceivedEmailsListSearch = createListSearch(getReceivedEmails);
export const getSegmentsListSearch = createListSearch(getSegments);
export const getSuppressionsListSearch = createListSearch(getSuppressions);
export const getTemplatesListSearch = createListSearch(getTemplates);
export const getTopicsListSearch = createListSearch(getTopics);
export const getWebhooksListSearch = createListSearch(getWebhooks);
export const getTemplateVariablesListSearch =
  createListSearch(getTemplateVariables);
