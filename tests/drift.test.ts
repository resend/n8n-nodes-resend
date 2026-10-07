import { afterEach, describe, expect, it, vi } from 'vitest';
import * as automations from '../nodes/Resend/actions/automation';
import * as contacts from '../nodes/Resend/actions/contact';
import * as contactProperties from '../nodes/Resend/actions/contactProperty';
import * as email from '../nodes/Resend/actions/email';
import * as events from '../nodes/Resend/actions/event';
import * as receivingEmails from '../nodes/Resend/actions/receivingEmail';
import * as templates from '../nodes/Resend/actions/template';
import * as topics from '../nodes/Resend/actions/topic';
import { createExecuteMock } from './helpers/context';

const locator = (value: string) => ({ mode: 'id', value });

afterEach(() => {
  vi.useRealTimers();
});

describe('email send drift', () => {
  it('forwards content_id and content_type for attachments', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        from: 'a@example.com',
        to: 'b@example.com',
        subject: 'Hi',
        useTemplate: false,
        emailFormat: 'html',
        html: '<img src="cid:logo">',
        additionalOptions: {
          attachments: {
            attachments: [
              {
                attachmentType: 'url',
                filename: 'logo.png',
                fileUrl: 'https://example.com/logo.png',
                content_id: 'logo',
                content_type: 'image/png',
              },
            ],
          },
        },
      },
      response: { id: 'e_1' },
    });

    await email.execute.call(context, 0, 'send');

    expect(httpRequest.mock.calls[0][1].body.attachments).toEqual([
      {
        filename: 'logo.png',
        path: 'https://example.com/logo.png',
        content_id: 'logo',
        content_type: 'image/png',
      },
    ]);
  });

  it('lets a template provide the sender and subject', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        from: '',
        to: 'b@example.com',
        subject: '',
        useTemplate: true,
        emailTemplateId: locator('tmpl_1'),
        emailTemplateVariables: {
          variables: [{ key: locator('NAME'), value: 'Ada' }],
        },
        additionalOptions: {},
      },
      response: { id: 'e_1' },
    });

    await email.execute.call(context, 0, 'send');

    expect(httpRequest.mock.calls[0][1].body).toEqual({
      to: ['b@example.com'],
      template: { id: 'tmpl_1', variables: { NAME: 'Ada' } },
    });
  });

  it('requires a subject when not sending a template', async () => {
    const { context } = createExecuteMock({
      parameters: {
        from: 'a@example.com',
        to: 'b@example.com',
        subject: '',
        useTemplate: false,
        additionalOptions: {},
      },
    });

    await expect(email.execute.call(context, 0, 'send')).rejects.toThrow(
      'From and Subject are required unless sending with a template.',
    );
  });

  it('sends the batch validation mode as a header', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        emails: {
          emails: [
            {
              from: 'a@example.com',
              to: 'b@example.com',
              subject: 'Hi',
              html: '<p>Hi</p>',
            },
          ],
        },
        batchOptions: { validation_mode: 'permissive' },
      },
      response: { data: [] },
    });

    await email.execute.call(context, 0, 'sendBatch');

    const options = httpRequest.mock.calls[0][1];
    expect(options.headers['x-batch-validation']).toBe('permissive');
    expect(options.qs).toBeUndefined();
  });
});

describe('sub-resource pagination drift', () => {
  it.each([
    [
      'email listAttachments',
      email.execute,
      'listAttachments',
      { emailId: locator('e_1') },
      '/emails/e_1/attachments',
    ],
    [
      'received email listAttachments',
      receivingEmails.execute,
      'listAttachments',
      { receivedEmailId: locator('r_1') },
      '/emails/receiving/r_1/attachments',
    ],
    [
      'contact getTopics',
      contacts.execute,
      'getTopics',
      { contactIdGetTopics: locator('c_1') },
      '/contacts/c_1/topics',
    ],
    [
      'contact listSegments',
      contacts.execute,
      'listSegments',
      { contactIdListSegments: locator('c_1') },
      '/contacts/c_1/segments',
    ],
  ])(
    '%s follows cursors and pairs with the input item',
    async (_label, execute, operation, parameters, endpoint) => {
      vi.useFakeTimers();
      const { context, httpRequest } = createExecuteMock({
        parameters: { ...parameters, returnAll: true },
        responses: [
          { data: [{ id: 'a' }], has_more: true },
          { data: [{ id: 'b' }], has_more: false },
        ],
      });

      const pending = execute.call(context, 2, operation);
      await vi.runAllTimersAsync();
      const result = await pending;

      expect(httpRequest.mock.calls[0][1].url).toBe(
        `https://api.resend.com${endpoint}`,
      );
      expect(httpRequest.mock.calls[1][1].qs.after).toBe('a');
      expect(result).toEqual([
        { json: { id: 'a' }, pairedItem: { item: 2 } },
        { json: { id: 'b' }, pairedItem: { item: 2 } },
      ]);
    },
  );

  it.each([
    ['received emails', receivingEmails.execute, '/emails/receiving'],
    ['templates', templates.execute, '/templates'],
    ['topics', topics.execute, '/topics'],
    ['contact properties', contactProperties.execute, '/contact-properties'],
    ['events', events.execute, '/events'],
    ['automations', automations.execute, '/automations'],
  ])(
    'lists %s with the configured limit',
    async (_label, execute, endpoint) => {
      const { context, httpRequest } = createExecuteMock({
        parameters: { returnAll: false, limit: 5 },
        response: { data: [], has_more: false },
      });

      await execute.call(context, 0, 'list');

      const options = httpRequest.mock.calls[0][1];
      expect(options.url).toBe(`https://api.resend.com${endpoint}`);
      expect(options.qs).toEqual({ limit: 5 });
    },
  );
});

describe('received email drift', () => {
  it('passes the html_format option', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        receivedEmailId: locator('r_1'),
        receivedEmailOptions: { htmlFormat: 'cid' },
      },
      response: { id: 'r_1' },
    });

    await receivingEmails.execute.call(context, 0, 'get');

    expect(httpRequest.mock.calls[0][1].qs).toEqual({ html_format: 'cid' });
  });
});

describe('contact drift', () => {
  it('sends typed property values on create', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        email: 'ada@example.com',
        contactCreateFields: {
          properties: {
            properties: [
              { key: 'plan', value: 'pro' },
              { key: 'seats', type: 'number', value: '5' },
              { key: 'company', type: 'null', value: '' },
            ],
          },
          segments: { segments: [{ id: 'seg_1' }] },
        },
      },
    });

    await contacts.execute.call(context, 0, 'create');

    expect(httpRequest.mock.calls[0][1].body).toEqual({
      email: 'ada@example.com',
      properties: { plan: 'pro', seats: 5, company: null },
      segments: [{ id: 'seg_1' }],
    });
  });

  it('sends boolean property values on update', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        updateBy: 'id',
        contactId: locator('c_1'),
        contactUpdateFields: {
          properties: {
            properties: [{ key: 'vip', type: 'boolean', value: 'true' }],
          },
        },
      },
    });

    await contacts.execute.call(context, 0, 'update');

    expect(httpRequest.mock.calls[0][1].body).toEqual({
      properties: { vip: true },
    });
  });

  it('rejects non numeric values for number properties', async () => {
    const { context } = createExecuteMock({
      parameters: {
        email: 'ada@example.com',
        contactCreateFields: {
          properties: {
            properties: [{ key: 'seats', type: 'number', value: 'many' }],
          },
        },
      },
    });

    await expect(contacts.execute.call(context, 0, 'create')).rejects.toThrow(
      'Property "seats" must be a number',
    );
  });

  it('lists contacts of a segment through the segment endpoint', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        returnAll: false,
        limit: 10,
        segmentIdFilter: locator('seg_1'),
      },
      response: { data: [] },
    });

    await contacts.execute.call(context, 0, 'list');

    const options = httpRequest.mock.calls[0][1];
    expect(options.url).toBe('https://api.resend.com/segments/seg_1/contacts');
    expect(options.qs).toEqual({ limit: 10 });
  });

  it('sends contact topic updates as an array body', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        contactIdUpdateTopics: locator('c_1'),
        topicsToUpdate: { topics: [{ id: 't_1', subscription: 'opt_out' }] },
      },
    });

    await contacts.execute.call(context, 0, 'updateTopics');

    expect(httpRequest.mock.calls[0][1].body).toEqual([
      { id: 't_1', subscription: 'opt_out' },
    ]);
  });
});

describe('contact property drift', () => {
  it('sends numeric fallback values for number properties', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        contactPropertyKey: 'seats',
        contactPropertyType: 'number',
        contactPropertyFallbackValue: '3',
      },
    });

    await contactProperties.execute.call(context, 0, 'create');

    expect(httpRequest.mock.calls[0][1].body).toEqual({
      key: 'seats',
      type: 'number',
      fallback_value: 3,
    });
  });
});

describe('template drift', () => {
  it('creates a template with snake case fields', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        templateName: 'Welcome',
        templateHtml: '<p>{{{COUNT}}}</p>',
        templateVariables: {
          variables: [{ key: 'COUNT', type: 'number', fallbackValue: '2' }],
        },
        templateCreateFields: {
          alias: 'welcome',
          replyTo: 'a@example.com, b@example.com',
          text: 'Count',
        },
      },
    });

    await templates.execute.call(context, 0, 'create');

    expect(httpRequest.mock.calls[0][1].body).toEqual({
      name: 'Welcome',
      html: '<p>{{{COUNT}}}</p>',
      alias: 'welcome',
      reply_to: ['a@example.com', 'b@example.com'],
      text: 'Count',
      variables: [{ key: 'COUNT', type: 'number', fallback_value: 2 }],
    });
  });

  it('maps reply to on update', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        templateId: locator('tmpl_1'),
        templateUpdateFields: { replyTo: 'a@example.com' },
      },
    });

    await templates.execute.call(context, 0, 'update');

    expect(httpRequest.mock.calls[0][1].body).toEqual({
      reply_to: ['a@example.com'],
    });
  });
});

describe('topic drift', () => {
  it('sends default_subscription on create', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        topicName: 'News',
        topicDefaultSubscription: 'opt_in',
        topicCreateOptions: {},
      },
    });

    await topics.execute.call(context, 0, 'create');

    expect(httpRequest.mock.calls[0][1].body).toEqual({
      name: 'News',
      default_subscription: 'opt_in',
    });
  });
});

describe('event drift', () => {
  it('sends contact_id when sending an event for a contact', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        eventName: 'signup',
        identifyBy: 'contactId',
        contactId: 'c_1',
      },
    });

    await events.execute.call(context, 0, 'send');

    expect(httpRequest.mock.calls[0][1].body).toEqual({
      event: 'signup',
      contact_id: 'c_1',
    });
  });
});

describe('automation drift', () => {
  it('filters automations by status', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        returnAll: false,
        limit: 50,
        automationStatusFilter: 'enabled',
      },
      response: { data: [] },
    });

    await automations.execute.call(context, 0, 'list');

    expect(httpRequest.mock.calls[0][1].qs).toEqual({
      limit: 50,
      status: 'enabled',
    });
  });

  it('filters runs by status and paginates', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        automationId: 'auto_1',
        returnAll: false,
        limit: 20,
        automationRunStatus: ['failed', 'running'],
      },
      response: { data: [] },
    });

    await automations.execute.call(context, 0, 'listRuns');

    const options = httpRequest.mock.calls[0][1];
    expect(options.url).toBe('https://api.resend.com/automations/auto_1/runs');
    expect(options.qs).toEqual({ limit: 20, status: 'failed,running' });
  });

  it('updates the name and graph without changing the status', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        automationId: 'auto_1',
        automationStatus: '',
        automationUpdateFields: {
          name: 'Renamed',
          steps: '[{"key":"trigger"}]',
          connections: '[]',
        },
      },
    });

    await automations.execute.call(context, 0, 'update');

    expect(httpRequest.mock.calls[0][1].body).toEqual({
      name: 'Renamed',
      steps: [{ key: 'trigger' }],
      connections: [],
    });
  });

  it('requires steps and connections together', async () => {
    const { context } = createExecuteMock({
      parameters: {
        automationId: 'auto_1',
        automationStatus: '',
        automationUpdateFields: { steps: '[]' },
      },
    });

    await expect(
      automations.execute.call(context, 0, 'update'),
    ).rejects.toThrow('Steps and Connections must be provided together');
  });
});
