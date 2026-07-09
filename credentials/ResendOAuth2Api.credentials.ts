import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ResendOAuth2Api implements ICredentialType {
  name = 'resendOAuth2Api';

  extends = ['oAuth2Api'];

  displayName = 'Resend OAuth2 API';

  documentationUrl =
    'https://resend.com/docs/guides/building-a-resend-oauth-client';

  icon = 'file:resend.svg' as const;

  properties: INodeProperties[] = [
    {
      displayName:
        'Before connecting, register your n8n instance as an OAuth client with Resend via <code>POST https://api.resend.com/oauth/register</code>. Use your n8n OAuth2 callback URL as the <code>redirect_uri</code> (e.g. <code>https://&lt;your-n8n-host&gt;/rest/oauth2-credential/callback</code>). Then paste the returned <code>client_id</code> in the Client ID field below.',
      name: 'setupNotice',
      type: 'notice',
      default: '',
    },
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'hidden',
      default: 'pkce',
    },
    {
      displayName: 'Authorization URL',
      name: 'authUrl',
      type: 'hidden',
      default: 'https://api.resend.com/oauth/authorize',
      required: true,
    },
    {
      displayName: 'Access Token URL',
      name: 'accessTokenUrl',
      type: 'hidden',
      default: 'https://api.resend.com/oauth/token',
      required: true,
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'options',
      options: [
        {
          name: 'Full Access (all API operations)',
          value: 'full_access',
          description:
            'Required for all API operations except send-only routes',
        },
        {
          name: 'Emails: Send (send-only)',
          value: 'emails:send',
          description:
            'Sufficient for POST /emails, POST /broadcasts/:id/send, and other send-only routes',
        },
      ],
      default: 'full_access',
    },
    {
      displayName: 'Authentication',
      name: 'authentication',
      type: 'hidden',
      // Resend uses public clients (no client_secret) with client_id in the body
      default: 'body',
    },
  ];
}
