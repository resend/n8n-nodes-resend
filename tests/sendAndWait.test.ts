import type { INodeProperties } from 'n8n-workflow';
import {
  NodeApiError,
  NodeOperationError,
  SEND_AND_WAIT_OPERATION,
} from 'n8n-workflow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { execute as sendAndWaitExecute } from '../nodes/Resend/actions/email/sendAndWait.operation';
import {
  ACTION_RECORDED_PAGE,
  BUTTON_STYLE_PRIMARY,
  BUTTON_STYLE_SECONDARY,
  createEmailBody,
} from '../nodes/Resend/utils/sendAndWait/email-templates';
import {
  configureWaitTillDate,
  createButton,
  createEmail,
  getSendAndWaitConfig,
  getSendAndWaitProperties,
  sendAndWaitWebhook,
  sendResendEmail,
} from '../nodes/Resend/utils/sendAndWait/utils';
import { createExecuteMock, createWebhookMock } from './helpers/context';

const approvalParameters = {
  sendTo: ' approver@example.com ',
  sendFrom: 'noreply@example.com',
  subject: 'Approve <this>',
  message: '  Please approve\\nthanks  ',
  responseType: 'approval',
  approvalOptions: { values: {} },
  options: {},
};

afterEach(() => {
  vi.useRealTimers();
});

describe('createEmailBody', () => {
  it('omits the footer when no attribution options are passed', () => {
    const html = createEmailBody('Hello', '<a>Approve</a>');

    expect(html).toContain('Hello');
    expect(html).toContain('<a>Approve</a>');
    expect(html).not.toContain('Automated with n8n');
  });

  it('adds an attribution footer without a campaign for an empty instance id', () => {
    const html = createEmailBody('Hello', '', { instanceId: '' });

    expect(html).toContain('Automated with n8n');
    expect(html).not.toContain('utm_campaign');
  });

  it('adds the instance id as the campaign', () => {
    const html = createEmailBody('Hello', '', { instanceId: 'instance-1' });

    expect(html).toContain('utm_campaign=instance-1');
  });
});

describe('createButton', () => {
  it('uses the primary style by default', () => {
    expect(createButton('https://n8n.test/resume', 'Approve', 'primary')).toBe(
      `<a href="https://n8n.test/resume" target="_blank" style="${BUTTON_STYLE_PRIMARY}">Approve</a>`,
    );
  });

  it('uses the secondary style when requested', () => {
    expect(
      createButton('https://n8n.test/resume', 'Decline', 'secondary'),
    ).toContain(BUTTON_STYLE_SECONDARY);
  });
});

describe('getSendAndWaitProperties', () => {
  it('scopes properties to the resource and the sendAndWait operation', () => {
    const properties = getSendAndWaitProperties([], 'email');

    for (const property of properties) {
      expect(property.displayOptions?.show?.operation).toEqual([
        SEND_AND_WAIT_OPERATION,
      ]);
      expect(property.displayOptions?.show?.resource).toEqual(['email']);
    }
  });

  it('omits the resource filter when no resource is given', () => {
    const [first] = getSendAndWaitProperties([], null);

    expect(first.displayOptions?.show?.resource).toBeUndefined();
  });

  it('exposes subject, message, response type and both option collections', () => {
    const names = getSendAndWaitProperties([]).map((property) => property.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'subject',
        'message',
        'responseType',
        'approvalOptions',
        'options',
      ]),
    );
  });

  it('drops button style fields when disabled', () => {
    const properties = getSendAndWaitProperties([], 'email', [], {
      noButtonStyle: true,
    });
    const approvalOptions = properties.find(
      (property) => property.name === 'approvalOptions',
    );
    const values = approvalOptions?.options?.[0] as {
      values: Array<{ name: string }>;
    };

    expect(values.values.map((value) => value.name)).toEqual([
      'approvalType',
      'approveLabel',
      'disapproveLabel',
    ]);
  });

  it('applies custom button labels', () => {
    const properties = getSendAndWaitProperties([], 'email', [], {
      defaultApproveLabel: 'Ship it',
      defaultDisapproveLabel: 'Hold',
    });
    const approvalOptions = properties.find(
      (property) => property.name === 'approvalOptions',
    );
    const values = approvalOptions?.options?.[0] as {
      values: Array<{ name: string; default: string }>;
    };

    expect(
      values.values.find((value) => value.name === 'approveLabel')?.default,
    ).toBe('Ship it');
    expect(
      values.values.find((value) => value.name === 'disapproveLabel')?.default,
    ).toBe('Hold');
  });

  it('keeps target and additional properties', () => {
    const target: INodeProperties = {
      displayName: 'To',
      name: 'sendTo',
      type: 'string',
      default: '',
    };
    const extra: INodeProperties = {
      displayName: 'From',
      name: 'sendFrom',
      type: 'string',
      default: '',
    };
    const names = getSendAndWaitProperties([target], 'email', [extra]).map(
      (property) => property.name,
    );

    expect(names[0]).toBe('sendTo');
    expect(names[names.length - 1]).toBe('sendFrom');
  });
});

describe('getSendAndWaitConfig', () => {
  it('escapes html and normalises newlines', () => {
    const { context } = createExecuteMock({ parameters: approvalParameters });

    const config = getSendAndWaitConfig(context);

    expect(config.title).toBe('Approve &lt;this&gt;');
    expect(config.message).toBe('Please approve\nthanks');
  });

  it('builds a single approve button by default', () => {
    const { context } = createExecuteMock({ parameters: approvalParameters });

    expect(getSendAndWaitConfig(context).options).toEqual([
      {
        label: 'Approve',
        url: 'https://n8n.test/resume?approved=true',
        style: 'primary',
      },
    ]);
  });

  it('builds disapprove and approve buttons for double approval', () => {
    const { context } = createExecuteMock({
      parameters: {
        ...approvalParameters,
        approvalOptions: {
          values: {
            approvalType: 'double',
            approveLabel: 'Yes',
            disapproveLabel: 'No',
            buttonApprovalStyle: 'secondary',
            buttonDisapprovalStyle: 'primary',
          },
        },
      },
    });

    expect(getSendAndWaitConfig(context).options).toEqual([
      {
        label: 'No',
        url: 'https://n8n.test/resume?approved=false',
        style: 'primary',
      },
      {
        label: 'Yes',
        url: 'https://n8n.test/resume?approved=true',
        style: 'secondary',
      },
    ]);
  });

  it('builds a single response button for free text', () => {
    const { context } = createExecuteMock({
      parameters: {
        ...approvalParameters,
        responseType: 'freeText',
        options: { messageButtonLabel: 'Reply <now>' },
      },
    });

    expect(getSendAndWaitConfig(context).options).toEqual([
      {
        label: 'Reply &lt;now&gt;',
        url: 'https://n8n.test/resume?approved=true',
        style: 'primary',
      },
    ]);
  });

  it('carries the attribution preference', () => {
    const { context } = createExecuteMock({
      parameters: {
        ...approvalParameters,
        options: { appendAttribution: false },
      },
    });

    expect(getSendAndWaitConfig(context).appendAttribution).toBe(false);
  });
});

describe('createEmail', () => {
  it('builds the approval email with attribution', () => {
    const { context } = createExecuteMock({
      parameters: approvalParameters,
      instanceId: 'instance-1',
    });

    const email = createEmail(context);

    expect(email.to).toBe('approver@example.com');
    expect(email.from).toBe('noreply@example.com');
    expect(email.subject).toBe('Approve &lt;this&gt;');
    expect(email.body).toBe('');
    expect(email.htmlBody).toContain('utm_campaign=instance-1');
    expect(email.htmlBody).toContain('Approve</a>');
  });

  it('skips attribution when disabled', () => {
    const { context } = createExecuteMock({
      parameters: {
        ...approvalParameters,
        options: { appendAttribution: false },
      },
    });

    expect(createEmail(context).htmlBody).not.toContain('Automated with n8n');
  });

  it('rejects a recipient list', () => {
    const { context } = createExecuteMock({
      parameters: {
        ...approvalParameters,
        sendTo: 'a@example.com, b@example.com',
      },
    });

    expect(() => createEmail(context)).toThrow(NodeOperationError);
  });

  it('rejects a recipient without an @', () => {
    const { context } = createExecuteMock({
      parameters: { ...approvalParameters, sendTo: 'approver' },
    });

    expect(() => createEmail(context)).toThrow('Invalid email address');
  });

  it('rejects an invalid sender', () => {
    const { context } = createExecuteMock({
      parameters: { ...approvalParameters, sendFrom: '' },
    });

    expect(() => createEmail(context)).toThrow('Invalid sender email address');
  });
});

describe('configureWaitTillDate', () => {
  it('waits indefinitely when no limit is configured', () => {
    const { context } = createExecuteMock({ parameters: { options: {} } });

    expect(configureWaitTillDate(context).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it('adds the configured interval from the options collection', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const { context } = createExecuteMock({
      parameters: {
        options: {
          limitWaitTime: {
            values: {
              limitType: 'afterTimeInterval',
              resumeAmount: 2,
              resumeUnit: 'hours',
            },
          },
        },
      },
    });

    expect(configureWaitTillDate(context).toISOString()).toBe(
      '2026-01-01T02:00:00.000Z',
    );
  });

  it('supports minutes and days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const minutes = createExecuteMock({
      parameters: {
        options: {
          limitWaitTime: {
            values: {
              limitType: 'afterTimeInterval',
              resumeAmount: 30,
              resumeUnit: 'minutes',
            },
          },
        },
      },
    });
    const days = createExecuteMock({
      parameters: {
        options: {
          limitWaitTime: {
            values: {
              limitType: 'afterTimeInterval',
              resumeAmount: 1,
              resumeUnit: 'days',
            },
          },
        },
      },
    });

    expect(configureWaitTillDate(minutes.context).toISOString()).toBe(
      '2026-01-01T00:30:00.000Z',
    );
    expect(configureWaitTillDate(days.context).toISOString()).toBe(
      '2026-01-02T00:00:00.000Z',
    );
  });

  it('uses a fixed date when configured', () => {
    const { context } = createExecuteMock({
      parameters: {
        options: {
          limitWaitTime: {
            values: {
              limitType: 'atSpecifiedTime',
              maxDateAndTime: '2026-05-01T12:00:00.000Z',
            },
          },
        },
      },
    });

    expect(configureWaitTillDate(context).toISOString()).toBe(
      '2026-05-01T12:00:00.000Z',
    );
  });

  it('reads root level limit parameters', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const { context } = createExecuteMock({
      parameters: {
        limitWaitTime: true,
        limitType: 'afterTimeInterval',
        resumeAmount: 15,
        resumeUnit: 'minutes',
      },
    });

    expect(configureWaitTillDate(context, 'root').toISOString()).toBe(
      '2026-01-01T00:15:00.000Z',
    );
  });

  it('ignores root limits when the toggle is off', () => {
    const { context } = createExecuteMock({
      parameters: { limitWaitTime: false },
    });

    expect(configureWaitTillDate(context, 'root').getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it('reports an invalid date', () => {
    const { context } = createExecuteMock({
      parameters: {
        options: {
          limitWaitTime: {
            values: {
              limitType: 'atSpecifiedTime',
              maxDateAndTime: 'not-a-date',
            },
          },
        },
      },
    });

    expect(() => configureWaitTillDate(context)).toThrow(
      'Could not configure Limit Wait Time',
    );
  });
});

describe('sendResendEmail', () => {
  it('posts the email and maps the reply-to field', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { authentication: 'oAuth2' },
    });

    await sendResendEmail(context, {
      from: 'noreply@example.com',
      to: 'approver@example.com',
      subject: 'Approve',
      body: '',
      htmlBody: '<p>Approve</p>',
      cc: 'cc@example.com',
      bcc: 'bcc@example.com',
      replyTo: 'reply@example.com',
    });

    expect(httpRequest).toHaveBeenCalledWith('resendOAuth2Api', {
      url: 'https://api.resend.com/emails',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        from: 'noreply@example.com',
        to: 'approver@example.com',
        subject: 'Approve',
        html: '<p>Approve</p>',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        reply_to: 'reply@example.com',
      },
      json: true,
    });
  });

  it('omits optional recipients that are not set', async () => {
    const { context, httpRequest } = createExecuteMock({});

    await sendResendEmail(context, {
      from: 'noreply@example.com',
      to: 'approver@example.com',
      subject: 'Approve',
      body: '',
      htmlBody: '<p>Approve</p>',
    });

    expect(httpRequest.mock.calls[0][1].body).not.toHaveProperty('cc');
    expect(httpRequest.mock.calls[0][1].body).not.toHaveProperty('bcc');
    expect(httpRequest.mock.calls[0][1].body).not.toHaveProperty('reply_to');
  });

  it('converts request failures into node errors', async () => {
    const { context } = createExecuteMock({
      requestError: {
        name: 'validation_error',
        message: 'bad from',
        statusCode: 422,
      },
    });

    await expect(
      sendResendEmail(context, {
        from: 'noreply@example.com',
        to: 'approver@example.com',
        subject: 'Approve',
        body: '',
        htmlBody: '',
      }),
    ).rejects.toBeInstanceOf(NodeApiError);
  });
});

describe('sendAndWaitWebhook', () => {
  it('records an approval from the query string', async () => {
    const { context, response } = createWebhookMock({
      parameters: { responseType: 'approval' },
      request: { method: 'GET', query: { approved: 'true' } },
    });

    const result = await sendAndWaitWebhook.call(context);

    expect(result).toEqual({
      webhookResponse: undefined,
      workflowData: [[{ json: { data: { approved: true } } }]],
    });
    expect(response.body).toBe(ACTION_RECORDED_PAGE);
    expect(response.headers['Content-Type']).toBe('text/html');
  });

  it('records a disapproval', async () => {
    const { context } = createWebhookMock({
      parameters: { responseType: 'approval' },
      request: { method: 'GET', query: { approved: 'false' } },
    });

    const result = await sendAndWaitWebhook.call(context);

    expect(result.workflowData).toEqual([
      [{ json: { data: { approved: false } } }],
    ]);
  });

  it('renders the free text form on GET', async () => {
    const { context, response } = createWebhookMock({
      parameters: {
        responseType: 'freeText',
        message: 'Line one\\nLine two',
        options: {
          responseFormTitle: 'Feedback <b>',
          responseFormButtonLabel: 'Send',
        },
      },
      request: { method: 'GET' },
      webhookUrl: 'https://n8n.test/webhook/form',
    });

    const result = await sendAndWaitWebhook.call(context);

    expect(result).toEqual({ noWebhookResponse: true });
    expect(response.body).toContain('<h1>Feedback &lt;b&gt;</h1>');
    expect(response.body).toContain('Line one\nLine two');
    expect(response.body).toContain('action="https://n8n.test/webhook/form"');
    expect(response.body).toContain('<button type="submit">Send</button>');
  });

  it('falls back to the message and the default button label', async () => {
    const { context, response } = createWebhookMock({
      parameters: {
        responseType: 'freeText',
        message: 'Describe the issue',
        options: {},
      },
      request: { method: 'GET' },
    });

    await sendAndWaitWebhook.call(context);

    expect(response.body).toContain('Describe the issue');
    expect(response.body).toContain('<button type="submit">Submit</button>');
    expect(response.body).not.toContain('<h1>');
  });

  it('returns the submitted free text on POST', async () => {
    const { context, response } = createWebhookMock({
      parameters: { responseType: 'freeText' },
      request: { method: 'POST', body: { response: 'looks good' } },
    });

    const result = await sendAndWaitWebhook.call(context);

    expect(result.workflowData).toEqual([
      [{ json: { data: { text: 'looks good' } } }],
    ]);
    expect(response.body).toBe(ACTION_RECORDED_PAGE);
  });

  it('defaults an empty free text submission to an empty string', async () => {
    const { context } = createWebhookMock({
      parameters: { responseType: 'freeText' },
      request: { method: 'POST', body: {} },
    });

    const result = await sendAndWaitWebhook.call(context);

    expect(result.workflowData).toEqual([[{ json: { data: { text: '' } } }]]);
  });
});

describe('sendAndWait operation', () => {
  it('sends the email and pauses the execution', async () => {
    const { context, httpRequest, waitCalls } = createExecuteMock({
      parameters: approvalParameters,
      inputData: [{ json: { id: 1 } }],
    });

    const result = await sendAndWaitExecute.call(context);

    expect(httpRequest).toHaveBeenCalledTimes(1);
    expect(waitCalls).toHaveLength(1);
    expect(result).toEqual([{ json: { id: 1 } }]);
  });
});
