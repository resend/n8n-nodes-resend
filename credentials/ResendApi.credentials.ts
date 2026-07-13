import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class ResendApi implements ICredentialType {
  name = 'resendApi';
  displayName = 'Resend API';
  documentationUrl = 'https://resend.com/docs/api-reference/introduction';
  icon = {
    light: 'file:resend-icon-black.svg',
    dark: 'file:resend-icon-white.svg',
  } as const;
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
    },
  ];
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '={{"Bearer " + $credentials.apiKey}}',
      },
    },
  };
  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.resend.com',
      url: '/api-keys',
      method: 'GET',
    },
  };
}
