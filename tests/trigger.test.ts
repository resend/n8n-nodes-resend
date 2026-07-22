import { createHmac } from 'node:crypto';
import type { ICredentialsDecrypted } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import { ResendTrigger } from '../nodes/Resend/ResendTrigger.node';
import { createHookMock, createWebhookMock } from './helpers/context';

const SIGNING_SECRET = `whsec_${Buffer.from('super-secret-value').toString('base64')}`;

function signPayload(payload: string, id: string, timestamp: string): string {
  const secretBytes = Buffer.from(
    SIGNING_SECRET.replace(/^whsec_/, ''),
    'base64',
  );
  const signature = createHmac('sha256', secretBytes)
    .update(`${id}.${timestamp}.${payload}`)
    .digest('base64');
  return `v1,${signature}`;
}

function signedWebhook(
  body: unknown,
  overrides: {
    headers?: Record<string, unknown>;
    events?: string[];
    timestamp?: string;
    credentials?: Record<string, Record<string, unknown>>;
    staticData?: Record<string, unknown>;
  } = {},
) {
  const payload = JSON.stringify(body);
  const id = 'msg_1';
  const timestamp =
    overrides.timestamp ?? String(Math.floor(Date.now() / 1000));

  return createWebhookMock({
    parameters: { events: overrides.events ?? ['email.sent'] },
    bodyData: body,
    request: { method: 'POST', rawBody: payload },
    headers: {
      'svix-id': id,
      'svix-timestamp': timestamp,
      'svix-signature': signPayload(payload, id, timestamp),
      ...overrides.headers,
    },
    staticData: overrides.staticData ?? {
      webhookSigningSecret: SIGNING_SECRET,
    },
    credentials: overrides.credentials,
  });
}

const trigger = new ResendTrigger();

describe('ResendTrigger description', () => {
  it('registers a single POST webhook with a configurable path', () => {
    expect(trigger.description.webhooks).toEqual([
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: '={{$parameter["path"]}}',
        isFullPath: true,
      },
    ]);
  });

  it('offers both optional credentials', () => {
    expect(trigger.description.credentials).toEqual([
      {
        name: 'resendWebhookSigningSecretApi',
        required: false,
        testedBy: 'resendWebhookSigningSecretTest',
      },
      { name: 'resendApi', required: false },
    ]);
  });

  it('lists only namespaced event values', () => {
    const events = trigger.description.properties.find(
      (property) => property.name === 'events',
    );

    expect(events?.options?.length).toBeGreaterThan(0);
    for (const option of events?.options ?? []) {
      expect((option as { value: string }).value).toMatch(/^[a-z]+\.[a-z_]+$/);
    }
  });
});

describe('signing secret credential test', () => {
  const runTest = (webhookSigningSecret: unknown) =>
    trigger.methods.credentialTest.resendWebhookSigningSecretTest.call(
      {} as never,
      { data: { webhookSigningSecret } } as unknown as ICredentialsDecrypted,
    );

  it('accepts a well formed secret', async () => {
    await expect(runTest(SIGNING_SECRET)).resolves.toEqual({
      status: 'OK',
      message: 'Signing secret format is valid',
    });
  });

  it('rejects a secret without the whsec_ prefix', async () => {
    await expect(runTest('nope')).resolves.toMatchObject({ status: 'Error' });
  });

  it('rejects a missing secret', async () => {
    await expect(runTest(undefined)).resolves.toMatchObject({
      status: 'Error',
    });
  });

  it('rejects a secret with an empty base64 body', async () => {
    await expect(runTest('whsec_')).resolves.toEqual({
      status: 'Error',
      message: 'Signing secret is not valid base64',
    });
  });
});

describe('webhookMethods', () => {
  const {
    checkExists,
    create,
    delete: remove,
  } = trigger.webhookMethods.default;

  it('treats a missing API credential as a manually managed webhook', async () => {
    const { context, httpRequest } = createHookMock();

    await expect(checkExists.call(context)).resolves.toBe(true);
    await expect(create.call(context)).resolves.toBe(true);
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it('reports no webhook when nothing was registered yet', async () => {
    const { context } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
    });

    await expect(checkExists.call(context)).resolves.toBe(false);
  });

  it('confirms an existing webhook', async () => {
    const { context, httpRequest } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
      staticData: { webhookId: 'wh_1' },
    });

    await expect(checkExists.call(context)).resolves.toBe(true);
    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/webhooks/wh_1',
      method: 'GET',
    });
  });

  it('forgets a webhook that no longer exists', async () => {
    const { context, staticData } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
      staticData: { webhookId: 'wh_1', webhookSigningSecret: SIGNING_SECRET },
      requestError: { httpCode: '404' },
    });

    await expect(checkExists.call(context)).resolves.toBe(false);
    expect(staticData).toEqual({});
  });

  it('surfaces other errors while checking', async () => {
    const { context } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
      staticData: { webhookId: 'wh_1' },
      requestError: { httpCode: '500' },
    });

    await expect(checkExists.call(context)).rejects.toBeInstanceOf(
      NodeApiError,
    );
  });

  it('registers the webhook and stores id and signing secret', async () => {
    const { context, httpRequest, staticData } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
      parameters: { events: ['email.sent', 'email.bounced'] },
      webhookUrl: 'https://n8n.test/webhook/resend',
      response: { id: 'wh_1', signing_secret: SIGNING_SECRET },
    });

    await expect(create.call(context)).resolves.toBe(true);
    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/webhooks',
      method: 'POST',
      body: {
        endpoint: 'https://n8n.test/webhook/resend',
        events: ['email.sent', 'email.bounced'],
      },
    });
    expect(staticData).toEqual({
      webhookId: 'wh_1',
      webhookSigningSecret: SIGNING_SECRET,
    });
  });

  it('reads the webhook id from a wrapped response', async () => {
    const { context, staticData } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
      parameters: { events: ['email.sent'] },
      response: { data: { id: 'wh_2', signing_secret: SIGNING_SECRET } },
    });

    await create.call(context);

    expect(staticData.webhookId).toBe('wh_2');
  });

  it('fails when Resend returns no webhook id', async () => {
    const { context } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
      parameters: { events: ['email.sent'] },
      response: {},
    });

    await expect(create.call(context)).rejects.toThrow(
      'Resend did not return a webhook ID',
    );
  });

  it('deletes the registered webhook and clears the stored data', async () => {
    const { context, httpRequest, staticData } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
      staticData: { webhookId: 'wh_1', webhookSigningSecret: SIGNING_SECRET },
    });

    await expect(remove.call(context)).resolves.toBe(true);
    expect(httpRequest.mock.calls[0][1]).toMatchObject({
      url: 'https://api.resend.com/webhooks/wh_1',
      method: 'DELETE',
    });
    expect(staticData).toEqual({});
  });

  it('ignores a webhook that was already removed', async () => {
    const { context, staticData } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
      staticData: { webhookId: 'wh_1' },
      requestError: { statusCode: 404 },
    });

    await expect(remove.call(context)).resolves.toBe(true);
    expect(staticData).toEqual({});
  });

  it('surfaces other errors while deleting', async () => {
    const { context } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
      staticData: { webhookId: 'wh_1' },
      requestError: { response: { status: 500 } },
    });

    await expect(remove.call(context)).rejects.toBeInstanceOf(NodeApiError);
  });

  it('does nothing when no webhook was stored', async () => {
    const { context, httpRequest } = createHookMock({
      credentials: { resendApi: { apiKey: 'x' } },
    });

    await expect(remove.call(context)).resolves.toBe(true);
    expect(httpRequest).not.toHaveBeenCalled();
  });
});

describe('webhook', () => {
  it('emits the payload for a subscribed event', async () => {
    const body = { type: 'email.sent', data: { email_id: 'e1' } };
    const { context } = signedWebhook(body);

    await expect(trigger.webhook.call(context)).resolves.toEqual({
      workflowData: [[{ json: body }]],
    });
  });

  it('accepts title cased Svix headers', async () => {
    const body = { type: 'email.sent' };
    const payload = JSON.stringify(body);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const { context } = createWebhookMock({
      parameters: { events: ['email.sent'] },
      bodyData: body,
      request: { method: 'POST', rawBody: payload },
      headers: {
        'Svix-Id': 'msg_1',
        'Svix-Timestamp': timestamp,
        'Svix-Signature': signPayload(payload, 'msg_1', timestamp),
      },
      staticData: { webhookSigningSecret: SIGNING_SECRET },
    });

    await expect(trigger.webhook.call(context)).resolves.toHaveProperty(
      'workflowData',
    );
  });

  it('reads the signing secret from the credential when none is stored', async () => {
    const body = { type: 'email.sent' };
    const { context } = signedWebhook(body, {
      staticData: {},
      credentials: {
        resendWebhookSigningSecretApi: { webhookSigningSecret: SIGNING_SECRET },
      },
    });

    await expect(trigger.webhook.call(context)).resolves.toHaveProperty(
      'workflowData',
    );
  });

  it('ignores events the workflow is not subscribed to', async () => {
    const { context } = signedWebhook(
      { type: 'email.bounced' },
      {
        events: ['email.sent'],
      },
    );

    await expect(trigger.webhook.call(context)).resolves.toEqual({
      noWebhookResponse: true,
    });
  });

  it('ignores payloads without an event type', async () => {
    const { context } = signedWebhook({ data: {} });

    await expect(trigger.webhook.call(context)).resolves.toEqual({
      noWebhookResponse: true,
    });
  });

  it('answers 401 when no signing secret is configured', async () => {
    const { context, response } = signedWebhook(
      { type: 'email.sent' },
      {
        staticData: {},
      },
    );

    await expect(trigger.webhook.call(context)).resolves.toEqual({
      noWebhookResponse: true,
    });
    expect(response.statusCode).toBe(401);
    expect(response.jsonBody).toEqual({
      error: 'Webhook signing secret is not configured',
    });
  });

  it('answers 401 when Svix headers are missing', async () => {
    const { context, response } = signedWebhook(
      { type: 'email.sent' },
      {
        headers: { 'svix-signature': '' },
      },
    );

    await trigger.webhook.call(context);

    expect(response.statusCode).toBe(401);
    expect(response.jsonBody).toEqual({
      error: 'Missing Svix signature headers',
    });
  });

  it('rejects a tampered payload', async () => {
    const { context, response } = signedWebhook({ type: 'email.sent' });
    const tampered = createWebhookMock({
      parameters: { events: ['email.sent'] },
      bodyData: { type: 'email.sent' },
      request: { method: 'POST', rawBody: '{"type":"email.opened"}' },
      headers: (
        context as unknown as { getHeaderData: () => Record<string, unknown> }
      ).getHeaderData(),
      staticData: { webhookSigningSecret: SIGNING_SECRET },
    });

    await expect(trigger.webhook.call(tampered.context)).resolves.toEqual({
      noWebhookResponse: true,
    });
    expect(tampered.response.jsonBody).toEqual({
      error: 'Invalid webhook signature',
    });
    expect(response.statusCode).toBeUndefined();
  });

  it('rejects a stale timestamp', async () => {
    const stale = String(Math.floor(Date.now() / 1000) - 60 * 60);
    const { context, response } = signedWebhook(
      { type: 'email.sent' },
      {
        timestamp: stale,
      },
    );

    await trigger.webhook.call(context);

    expect(response.jsonBody).toEqual({ error: 'Invalid webhook signature' });
  });

  it('rejects a non numeric timestamp', async () => {
    const { context, response } = signedWebhook(
      { type: 'email.sent' },
      {
        headers: { 'svix-timestamp': 'yesterday' },
      },
    );

    await trigger.webhook.call(context);

    expect(response.jsonBody).toEqual({ error: 'Invalid webhook signature' });
  });

  it('accepts millisecond timestamps', async () => {
    const { context } = signedWebhook(
      { type: 'email.sent' },
      {
        timestamp: String(Date.now()),
      },
    );

    await expect(trigger.webhook.call(context)).resolves.toHaveProperty(
      'workflowData',
    );
  });

  it('verifies a buffer raw body', async () => {
    const body = { type: 'email.sent' };
    const payload = JSON.stringify(body);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const { context } = createWebhookMock({
      parameters: { events: ['email.sent'] },
      bodyData: body,
      request: { method: 'POST', rawBody: Buffer.from(payload) },
      headers: {
        'svix-id': 'msg_1',
        'svix-timestamp': timestamp,
        'svix-signature': signPayload(payload, 'msg_1', timestamp),
      },
      staticData: { webhookSigningSecret: SIGNING_SECRET },
    });

    await expect(trigger.webhook.call(context)).resolves.toHaveProperty(
      'workflowData',
    );
  });

  it('accepts one valid signature among several', async () => {
    const body = { type: 'email.sent' };
    const payload = JSON.stringify(body);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const { context } = createWebhookMock({
      parameters: { events: ['email.sent'] },
      bodyData: body,
      request: { method: 'POST', rawBody: payload },
      headers: {
        'svix-id': 'msg_1',
        'svix-timestamp': timestamp,
        'svix-signature': `v1,${Buffer.from('wrong').toString('base64')} ${signPayload(payload, 'msg_1', timestamp)}`,
      },
      staticData: { webhookSigningSecret: SIGNING_SECRET },
    });

    await expect(trigger.webhook.call(context)).resolves.toHaveProperty(
      'workflowData',
    );
  });
});
