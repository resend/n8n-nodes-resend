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
