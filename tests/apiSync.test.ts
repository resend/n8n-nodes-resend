import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import * as account from '../nodes/Resend/actions/account';
import * as broadcasts from '../nodes/Resend/actions/broadcast';
import * as domains from '../nodes/Resend/actions/domain';
import * as segments from '../nodes/Resend/actions/segment';
import { createExecuteMock, type ParameterMap } from './helpers/context';

type ResourceExecute = (
  this: IExecuteFunctions,
  index: number,
  operation: string,
) => Promise<INodeExecutionData[]>;

interface RequestCase {
  name: string;
  execute: ResourceExecute;
  operation: string;
  parameters?: ParameterMap;
  method: string;
  endpoint: string;
  body?: unknown;
  noBody?: boolean;
}

const locator = (value: string) => ({ mode: 'id', value });

const removedTrackingDomainOperations = [
  'createTrackingDomain',
  'deleteTrackingDomain',
  'getTrackingDomain',
  'listTrackingDomains',
  'verifyTrackingDomain',
];

const cases: RequestCase[] = [
  {
    name: 'broadcast duplicate',
    execute: broadcasts.execute,
    operation: 'duplicate',
    parameters: { broadcastId: locator('bc 1') },
    method: 'POST',
    endpoint: '/broadcasts/bc%201/duplicate',
    noBody: true,
  },
  {
    name: 'broadcast create with send, schedule and preview text',
    execute: broadcasts.execute,
    operation: 'create',
    parameters: {
      segmentId: locator('seg_1'),
      broadcastFrom: 'news@example.com',
      broadcastSubject: 'Monthly update',
      broadcastHtml: '<p>Hi</p>',
      broadcastCreateOptions: {
        previewText: 'Our news',
        replyTo: 'a@example.com, b@example.com',
        send: true,
        scheduledAt: 'in 1 hour',
      },
    },
    method: 'POST',
    endpoint: '/broadcasts',
    body: {
      segment_id: 'seg_1',
      from: 'news@example.com',
      subject: 'Monthly update',
      html: '<p>Hi</p>',
      preview_text: 'Our news',
      reply_to: ['a@example.com', 'b@example.com'],
      send: true,
      scheduled_at: 'in 1 hour',
    },
  },
  {
    name: 'broadcast create without html',
    execute: broadcasts.execute,
    operation: 'create',
    parameters: {
      segmentId: locator('seg_1'),
      broadcastFrom: 'news@example.com',
      broadcastSubject: 'Draft',
      broadcastHtml: '',
      broadcastCreateOptions: { text: 'Plain' },
    },
    method: 'POST',
    endpoint: '/broadcasts',
    body: {
      segment_id: 'seg_1',
      from: 'news@example.com',
      subject: 'Draft',
      text: 'Plain',
    },
  },
  {
    name: 'broadcast update with preview text',
    execute: broadcasts.execute,
    operation: 'update',
    parameters: {
      broadcastId: locator('bc_1'),
      broadcastUpdateFields: {
        previewText: 'Preview',
        replyTo: 'a@example.com,b@example.com',
      },
    },
    method: 'PATCH',
    endpoint: '/broadcasts/bc_1',
    body: {
      preview_text: 'Preview',
      reply_to: ['a@example.com', 'b@example.com'],
    },
  },
  {
    name: 'broadcast update clearing preview text',
    execute: broadcasts.execute,
    operation: 'update',
    parameters: {
      broadcastId: locator('bc_1'),
      broadcastUpdateFields: { previewText: '' },
    },
    method: 'PATCH',
    endpoint: '/broadcasts/bc_1',
    body: { preview_text: '' },
  },
  {
    name: 'segment update',
    execute: segments.execute,
    operation: 'update',
    parameters: { segmentId: locator('seg 1'), segmentUpdateName: 'Renamed' },
    method: 'PATCH',
    endpoint: '/segments/seg%201',
    body: { name: 'Renamed' },
  },
  {
    name: 'domain create with tracking subdomain',
    execute: domains.execute,
    operation: 'create',
    parameters: {
      domainName: 'example.com',
      additionalOptions: { trackingSubdomain: 'links', clickTracking: true },
    },
    method: 'POST',
    endpoint: '/domains',
    body: {
      name: 'example.com',
      click_tracking: true,
      tracking_subdomain: 'links',
    },
  },
  {
    name: 'domain update with tracking subdomain and capabilities',
    execute: domains.execute,
    operation: 'update',
    parameters: {
      domainId: locator('dom_1'),
      domainUpdateOptions: {
        trackingSubdomain: 'links',
        receiving: 'enabled',
      },
    },
    method: 'PATCH',
    endpoint: '/domains/dom_1',
    body: {
      tracking_subdomain: 'links',
      capabilities: { receiving: 'enabled' },
    },
  },
  {
    name: 'account get usage',
    execute: account.execute,
    operation: 'getUsage',
    parameters: { authentication: 'apiKey' },
    method: 'GET',
    endpoint: '/usage',
    noBody: true,
  },
];

describe.each(cases)(
  '$name',
  ({ execute, operation, parameters, method, endpoint, body, noBody }) => {
    it(`calls ${method} ${endpoint}`, async () => {
      const mock = createExecuteMock({ parameters, response: { id: 'x' } });

      await expect(execute.call(mock.context, 0, operation)).resolves.toEqual([
        { json: { id: 'x' }, pairedItem: { item: 0 } },
      ]);

      const options = mock.httpRequest.mock.calls[0][1];
      expect(options.method).toBe(method);
      expect(options.url).toBe(`https://api.resend.com${endpoint}`);
      if (body !== undefined) {
        expect(options.body).toEqual(body);
      }
      if (noBody) {
        expect(options).not.toHaveProperty('body');
      }
    });
  },
);

describe('api sync validation', () => {
  it('uses the API key credential for get usage', async () => {
    const mock = createExecuteMock({
      parameters: { authentication: 'apiKey' },
      response: { object: 'usage' },
    });

    await account.execute.call(mock.context, 0, 'getUsage');

    expect(mock.httpRequest.mock.calls[0][0]).toBe('resendApi');
  });

  it('rejects a broadcast schedule without send', async () => {
    const mock = createExecuteMock({
      parameters: {
        segmentId: locator('seg_1'),
        broadcastFrom: 'news@example.com',
        broadcastSubject: 'Draft',
        broadcastHtml: '<p>Hi</p>',
        broadcastCreateOptions: { scheduledAt: 'in 1 hour' },
      },
    });

    await expect(
      broadcasts.execute.call(mock.context, 0, 'create'),
    ).rejects.toThrow('Scheduled At requires Send Immediately to be enabled');
    expect(mock.httpRequest).not.toHaveBeenCalled();
  });

  it('no longer exposes tracking domain operations', async () => {
    const options = domains.descriptions.find(
      (property) => property.name === 'operation',
    )?.options as Array<{ value: string }>;
    const values = options.map((option) => option.value);

    for (const operation of removedTrackingDomainOperations) {
      expect(values).not.toContain(operation);
      await expect(
        domains.execute.call(createExecuteMock().context, 0, operation),
      ).rejects.toThrow(`Unsupported operation: ${operation}`);
    }
  });

  it('rejects disabling both domain capabilities', async () => {
    const mock = createExecuteMock({
      parameters: {
        domainId: locator('dom_1'),
        domainUpdateOptions: { sending: 'disabled', receiving: 'disabled' },
      },
    });

    await expect(
      domains.execute.call(mock.context, 0, 'update'),
    ).rejects.toThrow('Sending and Receiving cannot both be disabled');
    expect(mock.httpRequest).not.toHaveBeenCalled();
  });
});
