import { describe, expect, it } from 'vitest';
import * as webhooks from '../nodes/Resend/actions/webhook';
import { webhookEventOptions } from '../nodes/Resend/actions/webhook/events';
import { ResendTrigger } from '../nodes/Resend/ResendTrigger.node';
import { createExecuteMock, type ParameterMap } from './helpers/context';

const locator = (value: string) => ({ mode: 'id', value });

const documentedEvents = [
  'contact.created',
  'contact.deleted',
  'contact.topics.updated',
  'contact.updated',
  'domain.created',
  'domain.deleted',
  'domain.updated',
  'email.bounced',
  'email.clicked',
  'email.complained',
  'email.delivered',
  'email.delivery_delayed',
  'email.failed',
  'email.opened',
  'email.received',
  'email.scheduled',
  'email.sent',
  'email.suppressed',
  'suppression.added',
  'suppression.removed',
  'topic.created',
  'topic.deleted',
  'topic.updated',
];

interface RequestCase {
  operation: string;
  parameters: ParameterMap;
  response?: unknown;
  method: string;
  endpoint: string;
  noBody?: boolean;
  qs?: unknown;
}

const cases: RequestCase[] = [
  {
    operation: 'rotateSigningSecret',
    parameters: { webhookId: locator('wh 1') },
    method: 'POST',
    endpoint: '/webhooks/wh%201/signing-secret/rotate',
    noBody: true,
  },
  {
    operation: 'listEvents',
    parameters: { webhookId: locator('wh_1'), returnAll: false, limit: 20 },
    response: { data: [] },
    method: 'GET',
    endpoint: '/webhooks/wh_1/events',
    qs: { limit: 20 },
  },
  {
    operation: 'getEvent',
    parameters: { webhookId: locator('wh_1'), webhookEventId: 'msg/1' },
    method: 'GET',
    endpoint: '/webhooks/wh_1/events/msg%2F1',
  },
  {
    operation: 'replayEvent',
    parameters: { webhookId: locator('wh_1'), webhookEventId: 'msg_1' },
    method: 'POST',
    endpoint: '/webhooks/wh_1/events/msg_1/replay',
    noBody: true,
  },
  {
    operation: 'listEventAttempts',
    parameters: {
      webhookId: locator('wh_1'),
      webhookEventId: 'msg_1',
      returnAll: false,
      limit: 10,
    },
    response: { data: [] },
    method: 'GET',
    endpoint: '/webhooks/wh_1/events/msg_1/attempts',
    qs: { limit: 10 },
  },
  {
    operation: 'list',
    parameters: { returnAll: false, limit: 5 },
    response: { data: [] },
    method: 'GET',
    endpoint: '/webhooks',
    qs: { limit: 5 },
  },
];

describe.each(cases)(
  'webhooks $operation',
  ({ operation, parameters, response, method, endpoint, noBody, qs }) => {
    it(`calls ${method} ${endpoint}`, async () => {
      const mock = createExecuteMock({
        parameters,
        response: response ?? { id: 'wh_1' },
      });

      await webhooks.execute.call(mock.context, 0, operation);

      const options = mock.httpRequest.mock.calls[0][1];
      expect(options.method).toBe(method);
      expect(options.url).toBe(`https://api.resend.com${endpoint}`);
      if (noBody) {
        expect(options).not.toHaveProperty('body');
      }
      if (qs !== undefined) {
        expect(options.qs).toEqual(qs);
      }
    });
  },
);

describe('webhook events', () => {
  it('paginates event listings with the after cursor', async () => {
    const mock = createExecuteMock({
      parameters: { webhookId: locator('wh_1'), returnAll: true },
      responses: [
        { data: [{ id: 'msg_1' }], has_more: true },
        { data: [{ id: 'msg_2' }], has_more: false },
      ],
    });

    const result = await webhooks.execute.call(mock.context, 0, 'listEvents');

    expect(result.map((item) => item.json.id)).toEqual(['msg_1', 'msg_2']);
    expect(mock.httpRequest.mock.calls[1][1].qs).toEqual({
      limit: 100,
      after: 'msg_1',
    });
  });

  it('rejects a blank event ID', async () => {
    const mock = createExecuteMock({
      parameters: { webhookId: locator('wh_1'), webhookEventId: '  ' },
    });

    await expect(
      webhooks.execute.call(mock.context, 0, 'replayEvent'),
    ).rejects.toThrow('Event ID is required');
    expect(mock.httpRequest).not.toHaveBeenCalled();
  });

  it('registers the list operations as list operations', () => {
    expect([...webhooks.execute.listOperations].sort()).toEqual([
      'list',
      'listEventAttempts',
      'listEvents',
    ]);
  });

  it('offers every documented webhook event type', () => {
    expect(webhookEventOptions.map((option) => option.value).sort()).toEqual(
      [...documentedEvents].sort(),
    );
  });

  it('keeps event options sorted by name', () => {
    const names = webhookEventOptions.map((option) => option.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('shares the event options between the node and the trigger', () => {
    const trigger = new ResendTrigger();
    const triggerEvents = trigger.description.properties.find(
      (property) => property.name === 'events',
    );
    const createEvents = webhooks.descriptions.find(
      (property) => property.name === 'webhookEvents',
    );

    expect(triggerEvents?.options).toBe(webhookEventOptions);
    expect(createEvents?.options).toBe(webhookEventOptions);
  });
});
