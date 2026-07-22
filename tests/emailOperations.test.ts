import { NodeApiError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import { execute as cancel } from '../nodes/Resend/actions/email/cancel.operation';
import { execute as listAttachments } from '../nodes/Resend/actions/email/listAttachments.operation';
import { execute as retrieve } from '../nodes/Resend/actions/email/retrieve.operation';
import { execute as send } from '../nodes/Resend/actions/email/send.operation';
import { execute as sendBatch } from '../nodes/Resend/actions/email/sendBatch.operation';
import { execute as update } from '../nodes/Resend/actions/email/update.operation';
import { createExecuteMock } from './helpers/context';

const baseSend = {
  from: 'noreply@example.com',
  to: 'one@example.com, two@example.com',
  subject: 'Hello',
  useTemplate: false,
  emailFormat: 'html',
  html: '<p>Hi</p>',
};

function sendMock(
  parameters: Record<string, unknown>,
  binary?: Record<string, unknown>,
) {
  return createExecuteMock({
    parameters: { ...baseSend, ...parameters },
    inputData: [{ json: {}, binary: binary as never }],
    response: { id: 'email_1' },
  });
}

describe('email send', () => {
  it('posts the normalised recipients and html content', async () => {
    const { context, httpRequest } = sendMock({});

    const result = await send.call(context, 0);

    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/emails',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(httpRequest.mock.calls[0][1].body).toEqual({
      from: 'noreply@example.com',
      to: ['one@example.com', 'two@example.com'],
      subject: 'Hello',
      html: '<p>Hi</p>',
    });
    expect(result).toEqual([
      { json: { id: 'email_1' }, pairedItem: { item: 0 } },
    ]);
  });

  it('sends both html and text content', async () => {
    const { context, httpRequest } = sendMock({
      emailFormat: 'both',
      text: 'Hi',
    });

    await send.call(context, 0);

    expect(httpRequest.mock.calls[0][1].body).toMatchObject({
      html: '<p>Hi</p>',
      text: 'Hi',
    });
  });

  it('requires html content in html mode', async () => {
    const { context } = sendMock({ html: '' });

    await expect(send.call(context, 0)).rejects.toThrow(
      'HTML Content is required.',
    );
  });

  it('requires text content in text mode', async () => {
    const { context } = sendMock({ emailFormat: 'text', text: '' });

    await expect(send.call(context, 0)).rejects.toThrow(
      'Text Content is required.',
    );
  });

  it('sends a template with variables', async () => {
    const { context, httpRequest } = sendMock({
      useTemplate: true,
      html: '',
      emailTemplateId: { mode: 'list', value: 'tmpl_1' },
      emailTemplateVariables: { variables: [{ key: 'name', value: 'Ada' }] },
    });

    await send.call(context, 0);

    expect(httpRequest.mock.calls[0][1].body.template).toEqual({
      id: 'tmpl_1',
      variables: { name: 'Ada' },
    });
  });

  it('requires a template id in template mode', async () => {
    const { context } = sendMock({
      useTemplate: true,
      html: '',
      emailTemplateId: { mode: 'id', value: '' },
    });

    await expect(send.call(context, 0)).rejects.toThrow(
      'Template Name or ID is required',
    );
  });

  it('rejects mixing a template with inline content', async () => {
    const { context } = sendMock({
      useTemplate: true,
      emailTemplateId: { mode: 'id', value: 'tmpl_1' },
    });

    await expect(send.call(context, 0)).rejects.toThrow(
      'HTML/Text Content cannot be used when sending with a template.',
    );
  });

  it('maps the additional options onto the API field names', async () => {
    const { context, httpRequest } = sendMock({
      additionalOptions: {
        cc: 'cc@example.com',
        bcc: ['bcc@example.com'],
        replyTo: 'reply@example.com',
        headers: {
          headers: [{ name: 'X-Entity', value: 'order' }, { name: '' }],
        },
        tags: {
          tags: [
            { name: 'campaign', value: 'welcome' },
            { name: 'flag' },
            { value: 'skipped' },
          ],
        },
        topicId: 'topic_1',
        scheduledAt: 'in 1 hour',
      },
    });

    await send.call(context, 0);

    expect(httpRequest.mock.calls[0][1].body).toMatchObject({
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
      reply_to: ['reply@example.com'],
      headers: { 'X-Entity': 'order' },
      tags: [
        { name: 'campaign', value: 'welcome' },
        { name: 'flag', value: '' },
      ],
      topic_id: 'topic_1',
      scheduled_at: 'in 1 hour',
    });
  });

  it('drops empty recipient lists', async () => {
    const { context, httpRequest } = sendMock({
      additionalOptions: { cc: ' , ', bcc: '', replyTo: ' , ' },
    });

    await send.call(context, 0);

    const body = httpRequest.mock.calls[0][1].body;
    expect(body).not.toHaveProperty('cc');
    expect(body).not.toHaveProperty('bcc');
    expect(body).not.toHaveProperty('reply_to');
  });

  it('sends binary attachments as base64 content', async () => {
    const { context, httpRequest } = sendMock(
      {
        additionalOptions: {
          attachments: {
            attachments: [
              {
                attachmentType: 'binaryData',
                binaryPropertyName: 'data',
                contentId: 'cid-1',
                contentType: 'application/pdf',
              },
            ],
          },
        },
      },
      { data: { data: 'YmFzZTY0', fileName: 'invoice.pdf' } },
    );

    await send.call(context, 0);

    expect(httpRequest.mock.calls[0][1].body.attachments).toEqual([
      {
        filename: 'invoice.pdf',
        content: 'YmFzZTY0',
        content_id: 'cid-1',
        content_type: 'application/pdf',
      },
    ]);
  });

  it('fails when the binary property is missing', async () => {
    const { context } = sendMock({
      additionalOptions: {
        attachments: {
          attachments: [
            { attachmentType: 'binaryData', binaryPropertyName: 'file' },
          ],
        },
      },
    });

    await expect(send.call(context, 0)).rejects.toThrow(
      'Binary property "file" not found in item 0',
    );
  });

  it('fails when a binary attachment has no file name', async () => {
    const { context } = sendMock(
      {
        additionalOptions: {
          attachments: {
            attachments: [
              { attachmentType: 'binaryData', binaryPropertyName: 'data' },
            ],
          },
        },
      },
      { data: { data: 'YmFzZTY0' } },
    );

    await expect(send.call(context, 0)).rejects.toThrow(
      'File Name is required for binary attachments.',
    );
  });

  it('sends url attachments as a path', async () => {
    const { context, httpRequest } = sendMock({
      additionalOptions: {
        attachments: {
          attachments: [
            {
              attachmentType: 'url',
              filename: 'report.pdf',
              fileUrl: 'https://example.com/report.pdf',
            },
          ],
        },
      },
    });

    await send.call(context, 0);

    expect(httpRequest.mock.calls[0][1].body.attachments).toEqual([
      { filename: 'report.pdf', path: 'https://example.com/report.pdf' },
    ]);
  });

  it('requires a file name and url for url attachments', async () => {
    const withoutName = sendMock({
      additionalOptions: {
        attachments: {
          attachments: [
            { attachmentType: 'url', fileUrl: 'https://example.com/a.pdf' },
          ],
        },
      },
    });
    const withoutUrl = sendMock({
      additionalOptions: {
        attachments: {
          attachments: [{ attachmentType: 'url', filename: 'a.pdf' }],
        },
      },
    });

    await expect(send.call(withoutName.context, 0)).rejects.toThrow(
      'File Name is required for URL attachments.',
    );
    await expect(send.call(withoutUrl.context, 0)).rejects.toThrow(
      'File URL is required for URL attachments.',
    );
  });

  it('rejects attachments on scheduled emails', async () => {
    const { context } = sendMock({
      additionalOptions: {
        scheduledAt: 'in 1 hour',
        attachments: {
          attachments: [
            {
              attachmentType: 'url',
              filename: 'a.pdf',
              fileUrl: 'https://example.com/a.pdf',
            },
          ],
        },
      },
    });

    await expect(send.call(context, 0)).rejects.toThrow(
      'Attachments cannot be used with scheduled emails.',
    );
  });

  it('forwards the idempotency key as a header', async () => {
    const { context, httpRequest } = sendMock({
      additionalOptions: { idempotencyKey: 'key-1' },
    });

    await send.call(context, 0);

    expect(httpRequest.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      'Idempotency-Key': 'key-1',
    });
  });

  it('reports API failures with the item index', async () => {
    const { context } = createExecuteMock({
      parameters: baseSend,
      requestError: {
        name: 'validation_error',
        message: 'bad from',
        statusCode: 422,
      },
    });

    await expect(send.call(context, 0)).rejects.toBeInstanceOf(NodeApiError);
  });
});

describe('email sendBatch', () => {
  const batchEmail = {
    from: 'noreply@example.com',
    to: 'one@example.com',
    subject: 'Hello',
    html: '<p>Hi</p>',
  };

  it('posts every email in the batch', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        emails: {
          emails: [batchEmail, { ...batchEmail, to: 'two@example.com' }],
        },
      },
      response: { data: [] },
    });

    await sendBatch.call(context, 0);

    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/emails/batch',
      method: 'POST',
    });
    expect(httpRequest.mock.calls[0][1].body).toEqual([
      {
        from: 'noreply@example.com',
        to: ['one@example.com'],
        subject: 'Hello',
        html: '<p>Hi</p>',
      },
      {
        from: 'noreply@example.com',
        to: ['two@example.com'],
        subject: 'Hello',
        html: '<p>Hi</p>',
      },
    ]);
  });

  it('maps the per email additional options', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        emails: {
          emails: [
            {
              ...batchEmail,
              additionalOptions: {
                cc: 'cc@example.com',
                bcc: 'bcc@example.com',
                replyTo: 'reply@example.com',
                headers: { headers: [{ name: 'X-Entity' }] },
                tags: { tags: [{ name: 'campaign', value: 'welcome' }] },
                topicId: 'topic_1',
                scheduledAt: 'in 2 hours',
              },
            },
          ],
        },
      },
      response: { data: [] },
    });

    await sendBatch.call(context, 0);

    expect(httpRequest.mock.calls[0][1].body[0]).toMatchObject({
      cc: ['cc@example.com'],
      bcc: ['bcc@example.com'],
      reply_to: ['reply@example.com'],
      headers: { 'X-Entity': '' },
      tags: [{ name: 'campaign', value: 'welcome' }],
      topic_id: 'topic_1',
      scheduled_at: 'in 2 hours',
    });
  });

  it('supports template based batch emails', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        emails: {
          emails: [
            {
              from: 'noreply@example.com',
              to: 'one@example.com',
              subject: 'Hello',
              useTemplate: true,
              templateId: 'tmpl_1',
              templateVariables: { variables: [{ key: 'name', value: 'Ada' }] },
            },
          ],
        },
      },
      response: { data: [] },
    });

    await sendBatch.call(context, 0);

    expect(httpRequest.mock.calls[0][1].body[0].template).toEqual({
      id: 'tmpl_1',
      variables: { name: 'Ada' },
    });
  });

  it('requires a template id when using templates', async () => {
    const { context } = createExecuteMock({
      parameters: {
        emails: { emails: [{ ...batchEmail, html: '', useTemplate: true }] },
      },
    });

    await expect(sendBatch.call(context, 0)).rejects.toThrow(
      'Template Name or ID is required for batch emails when using templates.',
    );
  });

  it('rejects mixing templates with inline content', async () => {
    const { context } = createExecuteMock({
      parameters: {
        emails: {
          emails: [{ ...batchEmail, useTemplate: true, templateId: 'tmpl_1' }],
        },
      },
    });

    await expect(sendBatch.call(context, 0)).rejects.toThrow(
      'HTML/Text Content cannot be used when sending batch emails with templates.',
    );
  });

  it('requires content for the selected format', async () => {
    const html = createExecuteMock({
      parameters: { emails: { emails: [{ ...batchEmail, html: '' }] } },
    });
    const text = createExecuteMock({
      parameters: {
        emails: { emails: [{ ...batchEmail, html: '', emailFormat: 'text' }] },
      },
    });

    await expect(sendBatch.call(html.context, 0)).rejects.toThrow(
      'HTML Content is required for batch emails.',
    );
    await expect(sendBatch.call(text.context, 0)).rejects.toThrow(
      'Text Content is required for batch emails.',
    );
  });

  it('forwards the batch options', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        emails: { emails: [batchEmail] },
        batchOptions: {
          idempotency_key: 'key-1',
          validation_mode: 'permissive',
        },
      },
      response: { data: [] },
    });

    await sendBatch.call(context, 0);

    expect(httpRequest.mock.calls[0][1].qs).toEqual({
      validation_mode: 'permissive',
    });
    expect(httpRequest.mock.calls[0][1].headers).toMatchObject({
      'Idempotency-Key': 'key-1',
    });
  });
});

describe('single email operations', () => {
  it('retrieves an email by id', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { emailId: { mode: 'id', value: 'email_1' } },
      response: { id: 'email_1' },
    });

    const result = await retrieve.call(context, 0);

    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/emails/email_1',
      method: 'GET',
    });
    expect(result).toEqual([
      { json: { id: 'email_1' }, pairedItem: { item: 0 } },
    ]);
  });

  it('cancels a scheduled email', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { emailId: { mode: 'id', value: 'email_1' } },
      response: { id: 'email_1' },
    });

    await cancel.call(context, 0);

    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/emails/email_1/cancel',
      method: 'POST',
    });
  });

  it('reschedules an email', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        emailId: { mode: 'id', value: 'email_1' },
        scheduledAt: '2026-05-01T12:00:00.000Z',
      },
      response: { id: 'email_1' },
    });

    await update.call(context, 0);

    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/emails/email_1',
      method: 'PATCH',
      body: { scheduled_at: '2026-05-01T12:00:00.000Z' },
    });
  });

  it('lists the attachments of an email', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { emailId: { mode: 'id', value: 'email_1' } },
      response: { data: [{ id: 'att_1' }] },
    });

    await listAttachments.call(context, 0);

    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/emails/email_1/attachments',
      method: 'GET',
    });
  });
});
