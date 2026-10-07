import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'OAuth Grant ID',
    name: 'oauthGrantId',
    type: 'string',
    required: true,
    default: '',
    placeholder: '650e8400-e29b-41d4-a716-446655440001',
    displayOptions: {
      show: {
        resource: ['account'],
        operation: ['revokeGrant'],
      },
    },
    description:
      'The unique identifier of the OAuth grant to revoke. Revoking a grant immediately disconnects that OAuth client and invalidates its access and refresh tokens. This cannot be undone.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const oauthGrantId = this.getNodeParameter('oauthGrantId', index) as string;

  const response = await apiRequest.call(
    this,
    'DELETE',
    `/oauth/grants/${encodeURIComponent(oauthGrantId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
