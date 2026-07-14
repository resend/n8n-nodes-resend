import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { handleResendApiError } from '../../transport';

export const description: INodeProperties[] = [];

interface ResendOAuth2CredentialData {
  clientId?: string;
  oauthTokenData?: {
    refresh_token?: string;
  };
}

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const authentication = this.getNodeParameter(
    'authentication',
    index,
    'apiKey',
  ) as string;

  if (authentication !== 'oAuth2') {
    throw new NodeOperationError(
      this.getNode(),
      "Disconnect is only available when the credential's Authentication is set to OAuth2.",
      { itemIndex: index },
    );
  }

  const credentials =
    await this.getCredentials<ResendOAuth2CredentialData>('resendOAuth2Api');

  const clientId = credentials.clientId;
  const refreshToken = credentials.oauthTokenData?.refresh_token;

  if (!clientId || !refreshToken) {
    throw new NodeOperationError(
      this.getNode(),
      'No active Resend OAuth connection was found to disconnect. Connect the credential first.',
      { itemIndex: index },
    );
  }

  try {
    await this.helpers.httpRequestWithAuthentication.call(
      this,
      'resendOAuth2Api',
      {
        method: 'POST',
        url: 'https://api.resend.com/oauth/revoke',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'n8n-nodes-resend',
        },
        body: {
          client_id: clientId,
          token: refreshToken,
          token_type_hint: 'refresh_token',
        },
        json: true,
      },
    );
  } catch (error) {
    handleResendApiError(this.getNode(), error, index);
  }

  return [
    {
      json: { disconnected: true },
      pairedItem: { item: index },
    },
  ];
}
