import { describe, expect, it } from 'vitest';
import { ResendApi } from '../credentials/ResendApi.credentials';
import { ResendOAuth2Api } from '../credentials/ResendOAuth2Api.credentials';
import { ResendWebhookSigningSecretApi } from '../credentials/ResendWebhookSigningSecretApi.credentials';

describe('ResendApi credential', () => {
  const credential = new ResendApi();

  it('is named so the nodes can reference it', () => {
    expect(credential.name).toBe('resendApi');
    expect(credential.displayName).toBe('Resend API');
  });

  it('asks for a masked, required API key', () => {
    expect(credential.properties).toHaveLength(1);
    expect(credential.properties[0]).toMatchObject({
      name: 'apiKey',
      type: 'string',
      required: true,
      typeOptions: { password: true },
      default: '',
    });
  });

  it('sends the API key as a bearer token', () => {
    expect(credential.authenticate).toEqual({
      type: 'generic',
      properties: {
        headers: { Authorization: '={{"Bearer " + $credentials.apiKey}}' },
      },
    });
  });

  it('tests the credential against a read-only endpoint', () => {
    expect(credential.test.request).toEqual({
      baseURL: 'https://api.resend.com',
      url: '/api-keys',
      method: 'GET',
    });
  });
});

describe('ResendOAuth2Api credential', () => {
  const credential = new ResendOAuth2Api();

  it('extends the generic OAuth2 credential', () => {
    expect(credential.name).toBe('resendOAuth2Api');
    expect(credential.extends).toEqual(['oAuth2Api']);
  });

  it('enables dynamic client registration against the Resend API', () => {
    const byName = Object.fromEntries(
      credential.properties.map((property) => [property.name, property]),
    );

    expect(byName.serverUrl).toMatchObject({
      type: 'hidden',
      default: 'https://api.resend.com',
    });
    expect(byName.useDynamicClientRegistration).toMatchObject({
      type: 'hidden',
      default: true,
    });
  });

  it('shows setup notices without collecting input', () => {
    const notices = credential.properties.filter(
      (property) => property.type === 'notice',
    );

    expect(notices.map((notice) => notice.name)).toEqual([
      'versionNotice',
      'redirectUrlNotice',
    ]);
  });
});

describe('ResendWebhookSigningSecretApi credential', () => {
  const credential = new ResendWebhookSigningSecretApi();

  it('asks for a masked, required signing secret', () => {
    expect(credential.name).toBe('resendWebhookSigningSecretApi');
    expect(credential.properties).toHaveLength(1);
    expect(credential.properties[0]).toMatchObject({
      name: 'webhookSigningSecret',
      required: true,
      typeOptions: { password: true },
    });
  });

  it('links to the signature verification docs', () => {
    expect(credential.documentationUrl).toBe(
      'https://resend.com/docs/webhooks/signature-verification',
    );
  });
});
