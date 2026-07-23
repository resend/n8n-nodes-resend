import { NodeApiError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import {
  getBroadcasts,
  getContactProperties,
  getContacts,
  getDomains,
  getEmails,
  getEmailsListSearch,
  getReceivedEmails,
  getSegments,
  getSuppressions,
  getTemplates,
  getTemplateVariables,
  getTopics,
  getWebhooks,
  getWebhooksListSearch,
} from '../nodes/Resend/methods';
import { createLoadOptionsMock } from './helpers/context';

describe('dropdown loaders', () => {
  const loaders = [
    { name: 'getTemplates', method: getTemplates, endpoint: '/templates' },
    { name: 'getSegments', method: getSegments, endpoint: '/segments' },
    { name: 'getTopics', method: getTopics, endpoint: '/topics' },
    { name: 'getBroadcasts', method: getBroadcasts, endpoint: '/broadcasts' },
    { name: 'getDomains', method: getDomains, endpoint: '/domains' },
    {
      name: 'getContactProperties',
      method: getContactProperties,
      endpoint: '/contact-properties',
    },
  ];

  for (const { name, method, endpoint } of loaders) {
    it(`${name} requests ${endpoint} with a limit of 100`, async () => {
      const { context, httpRequest } = createLoadOptionsMock({
        response: { data: [{ id: 'id-1', name: 'First' }] },
      });

      const options = await method.call(context);

      expect(httpRequest.mock.calls[0][1]).toMatchObject({
        url: `https://api.resend.com${endpoint}`,
        method: 'GET',
        qs: { limit: 100 },
      });
      expect(options).toEqual([{ name: 'First (id-1)', value: 'id-1' }]);
    });
  }

  it('falls back to the id when an item has no name', async () => {
    const { context } = createLoadOptionsMock({
      response: { data: [{ id: 'id-1' }] },
    });

    await expect(getTemplates.call(context)).resolves.toEqual([
      { name: 'id-1', value: 'id-1' },
    ]);
  });

  it('skips items without an id and tolerates a missing data array', async () => {
    const withoutId = createLoadOptionsMock({
      response: { data: [{ name: 'x' }] },
    });
    const withoutData = createLoadOptionsMock({ response: {} });

    await expect(getTemplates.call(withoutId.context)).resolves.toEqual([]);
    await expect(getTemplates.call(withoutData.context)).resolves.toEqual([]);
  });

  it('converts request failures into node errors', async () => {
    const { context } = createLoadOptionsMock({
      requestError: {
        name: 'restricted_api_key',
        message: 'nope',
        statusCode: 401,
      },
    });

    await expect(getTemplates.call(context)).rejects.toBeInstanceOf(
      NodeApiError,
    );
  });
});

describe('getSuppressions', () => {
  it('shows the suppressed email in the label', async () => {
    const { context } = createLoadOptionsMock({
      response: {
        data: [{ id: 'sup_1', email: 'blocked@example.com' }, { id: 'sup_2' }],
      },
    });

    await expect(getSuppressions.call(context)).resolves.toEqual([
      { name: 'blocked@example.com (sup_1)', value: 'sup_1' },
      { name: 'sup_2', value: 'sup_2' },
    ]);
  });
});

describe('getContacts', () => {
  it('combines name and email in the label', async () => {
    const { context } = createLoadOptionsMock({
      response: {
        data: [
          {
            id: 'c1',
            first_name: 'Ada',
            last_name: 'Lovelace',
            email: 'ada@example.com',
          },
          { id: 'c2', email: 'grace@example.com' },
          { id: 'c3', first_name: 'Alan' },
          { id: 'c4' },
        ],
      },
    });

    await expect(getContacts.call(context)).resolves.toEqual([
      { name: 'Ada Lovelace - ada@example.com (c1)', value: 'c1' },
      { name: 'grace@example.com (c2)', value: 'c2' },
      { name: 'Alan (c3)', value: 'c3' },
      { name: 'c4', value: 'c4' },
    ]);
  });
});

describe('getWebhooks', () => {
  it('truncates long endpoints and appends the status', async () => {
    const longEndpoint = `https://example.com/${'a'.repeat(60)}`;
    const { context } = createLoadOptionsMock({
      response: {
        data: [
          { id: 'wh_1', endpoint: longEndpoint, status: 'enabled' },
          { id: 'wh_2', endpoint: 'https://example.com/hook' },
          { id: 'wh_3' },
        ],
      },
    });

    const options = await getWebhooks.call(context);

    expect(options[0].name).toBe(
      `${longEndpoint.substring(0, 47)}... [enabled] (wh_1)`,
    );
    expect(options[1].name).toBe('https://example.com/hook (wh_2)');
    expect(options[2].name).toBe('wh_3');
  });
});

describe('email loaders', () => {
  const emailLoaders = [
    { name: 'getEmails', method: getEmails, endpoint: '/emails' },
    {
      name: 'getReceivedEmails',
      method: getReceivedEmails,
      endpoint: '/emails/receiving',
    },
  ];

  for (const { name, method, endpoint } of emailLoaders) {
    it(`${name} labels items with a truncated subject and date`, async () => {
      const longSubject = 'S'.repeat(60);
      const { context, httpRequest } = createLoadOptionsMock({
        response: {
          data: [
            {
              id: 'e1',
              subject: 'Welcome',
              created_at: '2026-03-07T10:00:00.000Z',
            },
            { id: 'e2', subject: longSubject },
            { id: 'e3' },
          ],
        },
      });

      const options = await method.call(context);

      expect(httpRequest.mock.calls[0][1].url).toBe(
        `https://api.resend.com${endpoint}`,
      );
      expect(options[0].name).toBe('Welcome - 07/03/2026 (e1)');
      expect(options[1].name).toBe(`${longSubject.substring(0, 47)}... (e2)`);
      expect(options[2].name).toBe('e3');
    });
  }
});

describe('getTemplateVariables', () => {
  it('returns nothing when no template is selected', async () => {
    const { context, httpRequest } = createLoadOptionsMock({});

    await expect(getTemplateVariables.call(context)).resolves.toEqual([]);
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it('reads the template id from a resourceLocator parameter', async () => {
    const { context, httpRequest } = createLoadOptionsMock({
      currentNodeParameters: {
        emailTemplateId: { mode: 'list', value: 'tmpl 1' },
      },
      response: {
        variables: [{ key: 'name', type: 'string' }, { key: 'plain' }],
      },
    });

    const options = await getTemplateVariables.call(context);

    expect(httpRequest.mock.calls[0][1].url).toBe(
      'https://api.resend.com/templates/tmpl%201',
    );
    expect(options).toEqual([
      { name: 'name (string)', value: 'name' },
      { name: 'plain', value: 'plain' },
    ]);
  });

  it('falls back to other template id parameter names', async () => {
    const { context, httpRequest } = createLoadOptionsMock({
      currentNodeParameters: { templateIdManual: 'tmpl_2' },
      response: { variables: [] },
    });

    await getTemplateVariables.call(context);

    expect(httpRequest.mock.calls[0][1].url).toBe(
      'https://api.resend.com/templates/tmpl_2',
    );
  });

  it('skips lookups for expression values', async () => {
    const { context, httpRequest } = createLoadOptionsMock({
      currentNodeParameters: { templateId: '={{ $json.templateId }}' },
    });

    await expect(getTemplateVariables.call(context)).resolves.toEqual([]);
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it('drops variables without a key', async () => {
    const { context } = createLoadOptionsMock({
      currentNodeParameters: { templateId: 'tmpl_3' },
      response: { variables: [{ key: '' }, { key: 'kept' }] },
    });

    await expect(getTemplateVariables.call(context)).resolves.toEqual([
      { name: 'kept', value: 'kept' },
    ]);
  });
});

describe('listSearch wrappers', () => {
  it('returns every option when no filter is given', async () => {
    const { context } = createLoadOptionsMock({
      response: { data: [{ id: 'wh_1', endpoint: 'https://example.com/a' }] },
    });

    await expect(getWebhooksListSearch.call(context)).resolves.toEqual({
      results: [{ name: 'https://example.com/a (wh_1)', value: 'wh_1' }],
    });
  });

  it('filters case insensitively on name and value', async () => {
    const { context } = createLoadOptionsMock({
      response: {
        data: [
          { id: 'e1', subject: 'Welcome' },
          { id: 'e2', subject: 'Invoice' },
        ],
      },
    });

    await expect(getEmailsListSearch.call(context, 'welcome')).resolves.toEqual(
      {
        results: [{ name: 'Welcome (e1)', value: 'e1' }],
      },
    );
    await expect(getEmailsListSearch.call(context, 'E2')).resolves.toEqual({
      results: [{ name: 'Invoice (e2)', value: 'e2' }],
    });
  });
});
