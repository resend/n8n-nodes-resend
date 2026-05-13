import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ResendWebhookSigningSecretApi implements ICredentialType {
  name = 'resendWebhookSigningSecretApi';
  displayName = 'Resend Webhook Signing Secret API';
  documentationUrl = 'https://resend.com/docs/webhooks/signature-verification';
  icon = 'file:resend.svg' as const;
  properties: INodeProperties[] = [
    {
      displayName: 'Webhook Signing Secret',
      name: 'webhookSigningSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'The webhook signing secret from your Resend webhook configuration page (whsec_... value). Each webhook endpoint has its own unique signing secret.',
    },
  ];
}
