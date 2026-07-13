import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class ResendOAuth2Api implements ICredentialType {
  name = 'resendOAuth2Api';

  extends = ['oAuth2Api'];

  displayName = 'Resend OAuth2 API';

  documentationUrl =
    'https://resend.com/docs/guides/building-a-resend-oauth-client';

  icon = {
    light: 'file:resend-icon-black.svg',
    dark: 'file:resend-icon-white.svg',
  } as const;

  properties: INodeProperties[] = [
    {
      displayName:
        'This one-click connection requires a recent version of n8n. If the <b>Connect</b> button does not work, update n8n, or use the <b>Resend API</b> credential (API key) instead.',
      name: 'versionNotice',
      type: 'notice',
      default: '',
    },
    {
      displayName:
        "Getting a 400 error when connecting? Check the <b>OAuth Redirect URL</b> shown above, it must be a public <code>https://</code> URL. If it shows an internal address like <code>http://n8n.local:5678</code>, your n8n instance's public URL is misconfigured. Set the <code>WEBHOOK_URL</code> environment variable to your instance's real HTTPS address (e.g. <code>https://your-n8n-domain.com/</code>) and restart n8n.",
      name: 'redirectUrlNotice',
      type: 'notice',
      default: '',
    },
    {
      // Drives n8n's built-in OAuth2 Dynamic Client Registration: on connect, n8n
      // discovers Resend's authorization server metadata from this URL's
      // /.well-known/oauth-authorization-server and POSTs to the discovered
      // registration_endpoint (https://api.resend.com/oauth/register) to obtain
      // a fresh client_id, then proceeds with the standard PKCE authorization flow.
      displayName: 'Server URL',
      name: 'serverUrl',
      type: 'hidden',
      default: 'https://api.resend.com',
    },
    {
      displayName: 'Use Dynamic Client Registration',
      name: 'useDynamicClientRegistration',
      type: 'hidden',
      default: true,
    },
  ];
}
