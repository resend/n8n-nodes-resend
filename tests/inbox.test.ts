import { describe, expect, it } from 'vitest';
import * as inboxes from '../nodes/Resend/actions/inbox';
import {
  getInboxes,
  getInboxesListSearch,
  getInboxLabels,
} from '../nodes/Resend/methods';
import { RESOURCE_METHOD_MAP } from '../nodes/Resend/utils/dynamicFields';
import {
  createExecuteMock,
  createLoadOptionsMock,
  type ParameterMap,
} from './helpers/context';

const locator = (value: string) => ({ mode: 'id', value });
const inbox = { inboxId: locator('inbox 1') };
const label = { ...inbox, inboxLabelId: locator('label/1') };

interface RequestCase {
  operation: string;
  parameters?: ParameterMap;
  response?: unknown;
  method: string;
  endpoint: string;
  body?: unknown;
  qs?: unknown;
}

const cases: RequestCase[] = [
  {
    operation: 'create',
    parameters: {
      inboxEmailAddress: 'support@example.com',
      inboxCreateFields: {
        name: 'Customer Support',
        fromName: 'Ada from Support',
        forwarding: true,
      },
    },
    method: 'POST',
    endpoint: '/inboxes',
    body: {
      email_address: 'support@example.com',
      name: 'Customer Support',
      from_name: 'Ada from Support',
      forwarding: true,
    },
  },
  {
    operation: 'create',
    parameters: { inboxEmailAddress: 'support@example.com' },
    method: 'POST',
    endpoint: '/inboxes',
    body: { email_address: 'support@example.com' },
  },
  {
    operation: 'get',
    parameters: { inboxId: locator('support@example.com') },
    method: 'GET',
    endpoint: '/inboxes/support%40example.com',
  },
  {
    operation: 'list',
    parameters: { returnAll: false, limit: 20 },
    response: { data: [] },
    method: 'GET',
    endpoint: '/inboxes',
    qs: { limit: 20 },
  },
  {
    operation: 'update',
    parameters: {
      ...inbox,
      inboxUpdateFields: { name: 'Support', fromName: 'Ada' },
    },
    method: 'PATCH',
    endpoint: '/inboxes/inbox%201',
    body: { name: 'Support', from_name: 'Ada' },
  },
  {
    operation: 'delete',
    parameters: inbox,
    method: 'DELETE',
    endpoint: '/inboxes/inbox%201',
  },
  {
    operation: 'getAgent',
    parameters: inbox,
    method: 'GET',
    endpoint: '/inboxes/inbox%201/agent',
  },
  {
    operation: 'updateAgent',
    parameters: {
      ...inbox,
      inboxAgentUpdateFields: {
        instructions: 'Escalate legal threats.',
        tone: 'friendly',
        enabledActions: ['draft_reply', 'add_labels'],
      },
    },
    method: 'PATCH',
    endpoint: '/inboxes/inbox%201/agent',
    body: {
      instructions: 'Escalate legal threats.',
      tone: 'friendly',
      enabled_actions: ['draft_reply', 'add_labels'],
    },
  },
  {
    operation: 'updateAgent',
    parameters: {
      ...inbox,
      inboxAgentUpdateFields: {
        clearInstructions: true,
        instructions: 'ignored',
        clearTone: true,
        enabledActions: [],
      },
    },
    method: 'PATCH',
    endpoint: '/inboxes/inbox%201/agent',
    body: { instructions: null, tone: null, enabled_actions: [] },
  },
  {
    operation: 'createLabel',
    parameters: {
      ...inbox,
      inboxLabelName: 'Urgent',
      inboxLabelCreateFields: { color: 'crimson' },
    },
    method: 'POST',
    endpoint: '/inboxes/inbox%201/labels',
    body: { name: 'Urgent', color: 'crimson' },
  },
  {
    operation: 'listLabels',
    parameters: inbox,
    response: { object: 'list', data: [] },
    method: 'GET',
    endpoint: '/inboxes/inbox%201/labels',
  },
  {
    operation: 'updateLabel',
    parameters: { ...label, inboxLabelUpdateFields: { color: 'orange' } },
    method: 'PATCH',
    endpoint: '/inboxes/inbox%201/labels/label%2F1',
    body: { color: 'orange' },
  },
  {
    operation: 'deleteLabel',
    parameters: label,
    method: 'DELETE',
    endpoint: '/inboxes/inbox%201/labels/label%2F1',
  },
];

describe.each(cases)(
  'inboxes $operation',
  ({ operation, parameters, response, method, endpoint, body, qs }) => {
    it(`calls ${method} ${endpoint}`, async () => {
      const { context, httpRequest } = createExecuteMock({
        parameters,
        response,
      });

      await inboxes.execute.call(context, 0, operation);

      expect(httpRequest).toHaveBeenCalledTimes(1);
      const options = httpRequest.mock.calls[0][1];
      expect(options.method).toBe(method);
      expect(options.url).toBe(`https://api.resend.com${endpoint}`);
      if (body === undefined) {
        expect(options.body).toBeUndefined();
      } else {
        expect(options.body).toEqual(body);
      }
      if (qs !== undefined) {
        expect(options.qs).toEqual(qs);
      }
    });
  },
);

describe('inbox operation behavior', () => {
  it('registers list as a list operation', () => {
    expect([...inboxes.execute.listOperations]).toEqual(['list']);
  });

  it('returns each label as a separate item paired with the input', async () => {
    const { context } = createExecuteMock({
      parameters: inbox,
      response: {
        object: 'list',
        data: [
          { id: 'l1', name: 'Billing' },
          { id: 'l2', name: 'Urgent' },
        ],
      },
    });

    const result = await inboxes.execute.call(context, 2, 'listLabels');

    expect(result).toEqual([
      { json: { id: 'l1', name: 'Billing' }, pairedItem: { item: 2 } },
      { json: { id: 'l2', name: 'Urgent' }, pairedItem: { item: 2 } },
    ]);
  });

  it.each([
    ['update', 'inboxUpdateFields'],
    ['updateAgent', 'inboxAgentUpdateFields'],
    ['updateLabel', 'inboxLabelUpdateFields'],
  ])('rejects %s without any fields', async (operation, fieldName) => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { ...label, [fieldName]: {} },
    });

    await expect(inboxes.execute.call(context, 0, operation)).rejects.toThrow(
      'Set at least one of',
    );
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it('marks every inbox field as belonging to the inboxes resource', () => {
    for (const property of inboxes.descriptions) {
      expect(property.displayOptions?.show?.resource).toEqual(['inboxes']);
    }
  });
});

describe('inbox methods', () => {
  it('maps the inbox resource locators to the inbox search methods', () => {
    expect(RESOURCE_METHOD_MAP.inbox).toBe('getInboxes');
    expect(RESOURCE_METHOD_MAP.inboxLabel).toBe('getInboxLabels');
  });

  it('lists inboxes with their name and address', async () => {
    const { context, httpRequest } = createLoadOptionsMock({
      response: {
        data: [
          { id: 'i1', name: 'Support', email_address: 'support@example.com' },
          {
            id: 'i2',
            name: 'billing@example.com',
            email_address: 'billing@example.com',
          },
          { id: 'i3' },
        ],
      },
    });

    const options = await getInboxes.call(context);

    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/inboxes',
      method: 'GET',
      qs: { limit: 100 },
    });
    expect(options).toEqual([
      { name: 'Support - support@example.com (i1)', value: 'i1' },
      { name: 'billing@example.com (i2)', value: 'i2' },
      { name: 'i3', value: 'i3' },
    ]);
  });

  it('filters inbox search results', async () => {
    const { context } = createLoadOptionsMock({
      response: {
        data: [
          { id: 'i1', email_address: 'support@example.com' },
          { id: 'i2', email_address: 'billing@example.com' },
        ],
      },
    });

    await expect(getInboxesListSearch.call(context, 'bill')).resolves.toEqual({
      results: [{ name: 'billing@example.com (i2)', value: 'i2' }],
    });
  });

  it('lists labels of the selected inbox', async () => {
    const { context, httpRequest } = createLoadOptionsMock({
      currentNodeParameters: { inboxId: { mode: 'list', value: 'inbox 1' } },
      response: { data: [{ id: 'l1', name: 'Urgent' }] },
    });

    const options = await getInboxLabels.call(context);

    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/inboxes/inbox%201/labels',
      method: 'GET',
    });
    expect(options).toEqual([{ name: 'Urgent (l1)', value: 'l1' }]);
  });

  it.each([
    ['no inbox is selected', {}],
    ['the inbox is an expression', { inboxId: '={{ $json.inbox }}' }],
  ])('returns no labels when %s', async (_label, currentNodeParameters) => {
    const { context, httpRequest } = createLoadOptionsMock({
      currentNodeParameters,
    });

    await expect(getInboxLabels.call(context)).resolves.toEqual([]);
    expect(httpRequest).not.toHaveBeenCalled();
  });
});
