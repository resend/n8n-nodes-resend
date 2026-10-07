import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import * as inboxDrafts from '../nodes/Resend/actions/inboxDraft';
import * as inboxThreads from '../nodes/Resend/actions/inboxThread';
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
  parameters: ParameterMap;
  response?: unknown;
  method: string;
  endpoint: string;
  body?: unknown;
  qs?: unknown;
}

const locator = (value: string) => ({ mode: 'id', value });
const base = 'https://api.resend.com/inboxes/inbox%201';
const inbox = { inboxId: locator('inbox 1') };
const thread = { ...inbox, inboxThreadId: 'thr/1' };
const threadEmail = { ...thread, inboxEmailId: 'em 1' };
const draft = { ...inbox, inboxDraftId: 'dr 1' };
const list = { returnAll: false, limit: 10 };

const cases: RequestCase[] = [
  {
    name: 'thread list with filters',
    execute: inboxThreads.execute,
    operation: 'list',
    parameters: {
      ...inbox,
      ...list,
      inboxThreadFilters: {
        folder: 'archive',
        label: locator('lbl_1'),
        query: ' refund ',
      },
    },
    response: { data: [] },
    method: 'GET',
    endpoint: `${base}/threads`,
    qs: { limit: 10, folder: 'archive', label: 'lbl_1', query: 'refund' },
  },
  {
    name: 'thread get',
    execute: inboxThreads.execute,
    operation: 'get',
    parameters: thread,
    method: 'GET',
    endpoint: `${base}/threads/thr%2F1`,
  },
  {
    name: 'thread update',
    execute: inboxThreads.execute,
    operation: 'update',
    parameters: {
      ...thread,
      inboxThreadUpdateFields: {
        read: false,
        folder: 'spam',
        labelId: locator('lbl_2'),
      },
    },
    method: 'PATCH',
    endpoint: `${base}/threads/thr%2F1`,
    body: { read: false, folder: 'spam', label_id: 'lbl_2' },
  },
  {
    name: 'thread delete',
    execute: inboxThreads.execute,
    operation: 'delete',
    parameters: thread,
    method: 'DELETE',
    endpoint: `${base}/threads/thr%2F1`,
  },
  {
    name: 'thread list emails',
    execute: inboxThreads.execute,
    operation: 'listEmails',
    parameters: { ...thread, ...list },
    response: { data: [] },
    method: 'GET',
    endpoint: `${base}/threads/thr%2F1/emails`,
    qs: { limit: 10 },
  },
  {
    name: 'thread get email',
    execute: inboxThreads.execute,
    operation: 'getEmail',
    parameters: threadEmail,
    method: 'GET',
    endpoint: `${base}/threads/thr%2F1/emails/em%201`,
  },
  {
    name: 'thread reply',
    execute: inboxThreads.execute,
    operation: 'reply',
    parameters: {
      ...threadEmail,
      html: '<p>Hi</p>',
      text: '',
      inboxReplyOptions: {
        cc: 'a@example.com, b@example.com',
        bcc: 'c@example.com',
        subject: 'Re: hi',
      },
    },
    method: 'POST',
    endpoint: `${base}/threads/thr%2F1/emails/em%201/reply`,
    body: {
      html: '<p>Hi</p>',
      cc: ['a@example.com', 'b@example.com'],
      bcc: ['c@example.com'],
      subject: 'Re: hi',
    },
  },
  {
    name: 'thread forward',
    execute: inboxThreads.execute,
    operation: 'forward',
    parameters: {
      ...threadEmail,
      to: 'x@example.com,y@example.com',
      inboxForwardOptions: { text: 'FYI' },
    },
    method: 'POST',
    endpoint: `${base}/threads/thr%2F1/emails/em%201/forward`,
    body: { to: ['x@example.com', 'y@example.com'], text: 'FYI' },
  },
  {
    name: 'draft create reply',
    execute: inboxDrafts.execute,
    operation: 'create',
    parameters: {
      ...inbox,
      inboxDraftFields: {
        to: 'ada@example.org',
        subject: 'Refund',
        html: '<p>Done</p>',
        threadId: 'thr_1',
        replyToEmailId: 'em_1',
      },
    },
    method: 'POST',
    endpoint: `${base}/drafts`,
    body: {
      to: ['ada@example.org'],
      subject: 'Refund',
      html: '<p>Done</p>',
      thread_id: 'thr_1',
      reply_to_email_id: 'em_1',
    },
  },
  {
    name: 'draft get',
    execute: inboxDrafts.execute,
    operation: 'get',
    parameters: draft,
    method: 'GET',
    endpoint: `${base}/drafts/dr%201`,
  },
  {
    name: 'draft list',
    execute: inboxDrafts.execute,
    operation: 'list',
    parameters: { ...inbox, ...list },
    response: { data: [] },
    method: 'GET',
    endpoint: `${base}/drafts`,
    qs: { limit: 10 },
  },
  {
    name: 'draft update',
    execute: inboxDrafts.execute,
    operation: 'update',
    parameters: {
      ...draft,
      inboxDraftUpdateFields: { subject: 'New subject', cc: 'a@example.com' },
    },
    method: 'PATCH',
    endpoint: `${base}/drafts/dr%201`,
    body: { cc: ['a@example.com'], subject: 'New subject' },
  },
  {
    name: 'draft delete',
    execute: inboxDrafts.execute,
    operation: 'delete',
    parameters: draft,
    method: 'DELETE',
    endpoint: `${base}/drafts/dr%201`,
  },
  {
    name: 'draft send',
    execute: inboxDrafts.execute,
    operation: 'send',
    parameters: draft,
    method: 'POST',
    endpoint: `${base}/drafts/dr%201/send`,
  },
];

describe('inbox thread and draft requests', () => {
  it.each(cases)('$name', async (testCase) => {
    const { context, httpRequest } = createExecuteMock({
      parameters: testCase.parameters,
      response: testCase.response ?? { id: 'ok' },
    });

    await testCase.execute.call(context, 0, testCase.operation);

    expect(httpRequest).toHaveBeenCalledTimes(1);
    const options = httpRequest.mock.calls[0][1] as Record<string, unknown>;
    expect(options.method).toBe(testCase.method);
    expect(options.url).toBe(testCase.endpoint);
    if (testCase.body === undefined) {
      expect(options.body).toBeUndefined();
    } else {
      expect(options.body).toEqual(testCase.body);
    }
    if (testCase.qs !== undefined) {
      expect(options.qs).toEqual(testCase.qs);
    }
  });

  it('requires html or text when replying', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { ...threadEmail, html: '', text: '' },
    });
    await expect(
      inboxThreads.execute.call(context, 0, 'reply'),
    ).rejects.toThrow('At least one of HTML Content or Text Content');
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it.each([
    ['threads', inboxThreads.execute, 'get', { ...thread }],
    ['drafts', inboxDrafts.execute, 'get', { ...draft }],
  ] as const)('requires an inbox for %s', async (_name, execute, operation, parameters) => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { ...parameters, inboxId: locator(' ') },
    });
    await expect(execute.call(context, 0, operation)).rejects.toThrow(
      'Inbox is required',
    );
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it('requires at least one thread update field', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { ...thread, inboxThreadUpdateFields: {} },
    });
    await expect(
      inboxThreads.execute.call(context, 0, 'update'),
    ).rejects.toThrow('At least one of Folder, Label, or Read');
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it('requires thread ID and reply email ID together for drafts', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        ...inbox,
        inboxDraftFields: { subject: 'Hi', threadId: 'thr_1' },
      },
    });
    await expect(
      inboxDrafts.execute.call(context, 0, 'create'),
    ).rejects.toThrow('must be set together');
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it('requires content when creating a draft', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { ...inbox, inboxDraftFields: {} },
    });
    await expect(
      inboxDrafts.execute.call(context, 0, 'create'),
    ).rejects.toThrow('At least one of To');
    expect(httpRequest).not.toHaveBeenCalled();
  });

  const emails = (count: number, prefix: string) =>
    Array.from({ length: count }, (_, i) => `${prefix}${i}@example.com`).join(
      ',',
    );

  it('allows exactly 50 combined recipients when forwarding', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        ...threadEmail,
        to: emails(25, 'to'),
        inboxForwardOptions: { cc: emails(25, 'cc') },
      },
      response: { id: 'ok' },
    });
    await inboxThreads.execute.call(context, 0, 'forward');
    expect(httpRequest).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      name: 'thread forward',
      execute: inboxThreads.execute,
      operation: 'forward',
      parameters: {
        ...threadEmail,
        to: emails(30, 'to'),
        inboxForwardOptions: { cc: emails(20, 'cc'), bcc: emails(1, 'bcc') },
      },
    },
    {
      name: 'thread reply',
      execute: inboxThreads.execute,
      operation: 'reply',
      parameters: {
        ...threadEmail,
        text: 'Hi',
        inboxReplyOptions: { cc: emails(26, 'cc'), bcc: emails(25, 'bcc') },
      },
    },
    {
      name: 'draft create',
      execute: inboxDrafts.execute,
      operation: 'create',
      parameters: {
        ...inbox,
        inboxDraftFields: { to: emails(51, 'to') },
      },
    },
    {
      name: 'draft update',
      execute: inboxDrafts.execute,
      operation: 'update',
      parameters: {
        ...draft,
        inboxDraftUpdateFields: { to: emails(40, 'to'), bcc: emails(11, 'b') },
      },
    },
  ])('rejects more than 50 recipients on $name', async (testCase) => {
    const { context, httpRequest } = createExecuteMock({
      parameters: testCase.parameters,
    });
    await expect(
      testCase.execute.call(context, 0, testCase.operation),
    ).rejects.toThrow('cannot exceed 50 recipients');
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it('marks operation options as sorted and scoped to the resource', () => {
    for (const [resource, module] of [
      ['inboxThreads', inboxThreads],
      ['inboxDrafts', inboxDrafts],
    ] as const) {
      const operation = module.operations[0];
      expect(operation.displayOptions?.show?.resource).toEqual([resource]);
      const names = (operation.options ?? []).map(
        (option) => (option as { name: string }).name,
      );
      expect(names).toEqual([...names].sort());
      for (const property of module.descriptions.slice(1)) {
        expect(property.displayOptions?.show?.resource).toEqual([resource]);
      }
    }
  });
});
