import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  INode,
  INodeExecutionData,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';

interface ResendApiError {
  name: string;
  message: string;
  statusCode: number;
}

function formatResendErrorTitle(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractResendError(error: unknown): ResendApiError | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const isResendShape = (obj: unknown): obj is ResendApiError => {
    if (!obj || typeof obj !== 'object') return false;
    const o = obj as Record<string, unknown>;
    return (
      typeof o.name === 'string' &&
      typeof o.message === 'string' &&
      o.name !== 'Error' &&
      o.name !== 'NodeApiError' &&
      o.name !== 'NodeOperationError' &&
      o.name !== 'AxiosError'
    );
  };

  const tryJson = (value: unknown): ResendApiError | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed.startsWith('{')) return undefined;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (isResendShape(parsed)) return parsed;
    } catch {
      /* not JSON */
    }
    return undefined;
  };

  if (isResendShape(error)) return error;

  const err = error as Record<string, unknown>;

  let result = tryJson(err.message) ?? tryJson(err.description);
  if (result) return result;

  if (err.cause && typeof err.cause === 'object') {
    const cause = err.cause as Record<string, unknown>;

    if (cause.response && typeof cause.response === 'object') {
      const resp = cause.response as Record<string, unknown>;
      if (isResendShape(resp.data)) {
        result = resp.data as ResendApiError;
        if (!result.statusCode && typeof resp.status === 'number') {
          result = { ...result, statusCode: resp.status };
        }
        return result;
      }
      result = tryJson(resp.data);
      if (result) return result;
    }

    if (isResendShape(cause.body)) return cause.body as ResendApiError;
    result = tryJson(cause.body);
    if (result) return result;

    if (cause.cause && typeof cause.cause === 'object') {
      const inner = cause.cause as Record<string, unknown>;
      if (inner.response && typeof inner.response === 'object') {
        const resp = inner.response as Record<string, unknown>;
        if (isResendShape(resp.data)) return resp.data as ResendApiError;
        result = tryJson(resp.data);
        if (result) return result;
      }
    }
  }

  return undefined;
}

interface ResponseHeaders {
  'ratelimit-limit'?: string;
  'ratelimit-remaining'?: string;
  'ratelimit-reset'?: string;
  'retry-after'?: string;
  'x-resend-daily-quota'?: string;
  'x-resend-monthly-quota'?: string;
}

function extractResponseHeaders(error: unknown): ResponseHeaders {
  if (!error || typeof error !== 'object') return {};
  const cause = (error as Record<string, unknown>).cause;
  if (!cause || typeof cause !== 'object') return {};
  const response = (cause as Record<string, unknown>).response;
  if (!response || typeof response !== 'object') return {};
  const headers = (response as Record<string, unknown>).headers;
  if (!headers || typeof headers !== 'object') return {};
  return headers as ResponseHeaders;
}

function sanitizeErrorMessage(message: string): string {
  return message.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`/g, "'");
}

function buildQuotaDescription(
  resendError: ResendApiError,
  headers: ResponseHeaders,
): string {
  const base = sanitizeErrorMessage(resendError.message);

  if (resendError.name === 'daily_quota_exceeded') {
    const retryAfter = headers['retry-after'] ?? headers['ratelimit-reset'];
    const resetNote = retryAfter
      ? ` Resets in approximately ${retryAfter} second(s).`
      : '';
    return `${base} Upgrade your plan to remove the daily sending limit, or wait until your quota resets.${resetNote}`;
  }

  if (resendError.name === 'monthly_quota_exceeded') {
    return `${base} Upgrade your plan to increase your monthly email quota.`;
  }

  // Generic rate-limit (e.g. rate_limit_exceeded)
  const retryAfter = headers['retry-after'] ?? headers['ratelimit-reset'];
  const remaining = headers['ratelimit-remaining'];
  const limit = headers['ratelimit-limit'];
  const parts: string[] = [base];
  if (limit !== undefined && remaining !== undefined) {
    parts.push(`Limit: ${limit} req/s, remaining: ${remaining}.`);
  }
  if (retryAfter) {
    parts.push(`Retry after ${retryAfter} second(s).`);
  }
  parts.push(
    'Consider reducing concurrent requests or adding a queue mechanism.',
  );
  return parts.join(' ');
}

export function handleResendApiError(
  node: INode,
  error: unknown,
  itemIndex?: number,
): never {
  const resendError = extractResendError(error);

  if (resendError) {
    const headers = extractResponseHeaders(error);
    const statusCode = resendError.statusCode;

    // 429 – rate limit or sending quota exceeded
    if (statusCode === 429) {
      const description = buildQuotaDescription(resendError, headers);
      throw new NodeApiError(
        node,
        {
          message: description,
          name: resendError.name,
          statusCode,
        } as unknown as JsonObject,
        {
          message: `${formatResendErrorTitle(resendError.name)} (429)`,
          description,
          httpCode: '429',
          ...(itemIndex !== undefined ? { itemIndex } : {}),
        },
      );
    }

    // 403 – contact quota exceeded (validation_error with quota message)
    if (
      statusCode === 403 &&
      resendError.name === 'validation_error' &&
      resendError.message.toLowerCase().includes('contacts quota')
    ) {
      const description = `${sanitizeErrorMessage(resendError.message)} Upgrade your Marketing plan to increase your contact limit and resume sending broadcasts.`;
      throw new NodeApiError(
        node,
        {
          message: description,
          name: resendError.name,
          statusCode,
        } as unknown as JsonObject,
        {
          message: 'Contact Quota Exceeded (403)',
          description,
          httpCode: '403',
          ...(itemIndex !== undefined ? { itemIndex } : {}),
        },
      );
    }

    const sanitizedMessage = sanitizeErrorMessage(resendError.message);
    throw new NodeApiError(
      node,
      {
        message: sanitizedMessage,
        name: resendError.name,
        statusCode,
      } as unknown as JsonObject,
      {
        message: `${formatResendErrorTitle(resendError.name)} (${statusCode})`,
        description: sanitizedMessage,
        httpCode: String(statusCode),
        ...(itemIndex !== undefined ? { itemIndex } : {}),
      },
    );
  }

  if (error instanceof NodeApiError || error instanceof NodeOperationError) {
    throw error;
  }

  throw new NodeApiError(node, (error ?? {}) as JsonObject, {
    ...(itemIndex !== undefined ? { itemIndex } : {}),
  });
}

export const RESEND_API_BASE = 'https://api.resend.com';

export async function apiRequest(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject | IDataObject[],
  qs?: IDataObject,
): Promise<IDataObject> {
  const options: IHttpRequestOptions = {
    url: `${RESEND_API_BASE}${endpoint}`,
    method,
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'n8n-nodes-resend',
    },
    json: true,
  };

  if (body) {
    options.body = body;
  }

  if (qs && Object.keys(qs).length > 0) {
    options.qs = qs;
  }

  try {
    return await this.helpers.httpRequestWithAuthentication.call(
      this,
      'resendApi',
      options,
    );
  } catch (error) {
    handleResendApiError(this.getNode(), error);
  }
}

export async function requestList(
  this: IExecuteFunctions,
  endpoint: string,
  extraQs?: IDataObject,
): Promise<IDataObject[]> {
  const returnAll = this.getNodeParameter('returnAll', 0, false) as boolean;
  const limit = this.getNodeParameter('limit', 0, 50) as number;

  const targetLimit = returnAll ? Number.POSITIVE_INFINITY : (limit ?? 50);
  const pageSize = Math.min(targetLimit, 100);
  const qs: Record<string, string | number> = { limit: pageSize, ...extraQs };

  const requestPage = async () => {
    try {
      return await this.helpers.httpRequestWithAuthentication.call(
        this,
        'resendApi',
        {
          url: `${RESEND_API_BASE}${endpoint}`,
          method: 'GET',
          headers: {
            'User-Agent': 'n8n-nodes-resend',
          },
          qs,
          json: true,
        },
      );
    } catch (error) {
      handleResendApiError(this.getNode(), error);
    }
  };

  const allItems: IDataObject[] = [];
  let hasMore = true;
  let isFirstRequest = true;

  while (hasMore) {
    if (!isFirstRequest) {
      await sleep(1000);
    }
    isFirstRequest = false;

    const response = await requestPage();
    const responseData = Array.isArray(
      (response as { data?: IDataObject[] }).data,
    )
      ? ((response as { data?: IDataObject[] }).data as IDataObject[])
      : [];
    allItems.push(...responseData);

    if (allItems.length >= targetLimit) {
      break;
    }

    hasMore = Boolean((response as { has_more?: boolean }).has_more);
    if (!hasMore || responseData.length === 0) {
      break;
    }

    const lastItem = responseData[responseData.length - 1] as
      | { id?: string }
      | undefined;
    if (!lastItem?.id) {
      break;
    }

    qs.after = lastItem.id;
  }

  return allItems.slice(0, targetLimit);
}

export function normalizeEmailList(
  value: string | string[] | undefined,
): string[] {
  if (Array.isArray(value)) {
    return value.map((email) => String(email).trim()).filter((email) => email);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email);
  }
  return [];
}

export function parseTemplateVariables(
  executeFunctions: IExecuteFunctions,
  variablesInput:
    | {
        variables?: Array<{
          key: string;
          type: string;
          fallbackValue?: unknown;
        }>;
      }
    | undefined,
  fallbackKey: 'fallbackValue' | 'fallback_value',
  itemIndex: number,
): Array<Record<string, unknown>> | undefined {
  if (!variablesInput?.variables?.length) {
    return undefined;
  }

  return variablesInput.variables.map((variable) => {
    const variableEntry: Record<string, unknown> = {
      key: variable.key,
      type: variable.type,
    };

    const fallbackValue = variable.fallbackValue;
    if (fallbackValue !== undefined && fallbackValue !== '') {
      let parsedFallback: string | number = fallbackValue as string;
      if (variable.type === 'number') {
        const numericFallback =
          typeof fallbackValue === 'number'
            ? fallbackValue
            : Number(fallbackValue);
        if (Number.isNaN(numericFallback)) {
          throw new NodeOperationError(
            executeFunctions.getNode(),
            `Variable "${variable.key}" fallback value must be a number`,
            { itemIndex },
          );
        }
        parsedFallback = numericFallback;
      }
      variableEntry[fallbackKey] = parsedFallback;
    }

    return variableEntry;
  });
}

export function buildTemplateSendVariables(
  variablesInput:
    | {
        variables?: Array<{
          key: string | { mode?: string; value?: unknown };
          value?: unknown;
        }>;
      }
    | undefined,
): Record<string, unknown> | undefined {
  if (!variablesInput?.variables?.length) {
    return undefined;
  }
  const variables: Record<string, unknown> = {};
  for (const variable of variablesInput.variables) {
    let keyValue: string | undefined;
    if (
      typeof variable.key === 'object' &&
      variable.key !== null &&
      'value' in variable.key
    ) {
      const extracted = variable.key.value;
      if (typeof extracted === 'string') {
        const trimmed = extracted.trim();
        if (trimmed) {
          keyValue = trimmed;
        }
      }
    } else if (typeof variable.key === 'string') {
      const trimmed = variable.key.trim();
      if (trimmed) {
        keyValue = trimmed;
      }
    }

    if (!keyValue) {
      continue;
    }
    variables[keyValue] = variable.value ?? '';
  }

  return Object.keys(variables).length ? variables : undefined;
}

export function assertHttpsEndpoint(node: INode, endpoint: string): void {
  const normalizedEndpoint = endpoint.trim().toLowerCase();
  if (normalizedEndpoint.startsWith('http://')) {
    throw new NodeOperationError(
      node,
      'Invalid webhook endpoint scheme. Resend requires a publicly reachable HTTPS URL.',
    );
  }
}

export function createListExecutionData(
  this: IExecuteFunctions,
  items: IDataObject[],
): INodeExecutionData[] {
  return items.map((item) => ({
    json: item,
    pairedItem: { item: 0 },
  }));
}

interface ItemOperation {
  execute(
    this: IExecuteFunctions,
    index: number,
  ): Promise<INodeExecutionData[]>;
}

interface ListOperation {
  execute(this: IExecuteFunctions): Promise<INodeExecutionData[]>;
}

export function createOperationRouter(
  itemOps: Record<string, ItemOperation>,
  listOps: Record<string, ListOperation> = {},
): (
  this: IExecuteFunctions,
  index: number,
  operation: string,
) => Promise<INodeExecutionData[]> {
  return async function execute(
    this: IExecuteFunctions,
    index: number,
    operation: string,
  ): Promise<INodeExecutionData[]> {
    const listOp = listOps[operation];
    if (listOp) {
      return listOp.execute.call(this);
    }
    const itemOp = itemOps[operation];
    if (itemOp) {
      return itemOp.execute.call(this, index);
    }
    throw new NodeOperationError(
      this.getNode(),
      `Unsupported operation: ${operation}`,
    );
  };
}
