import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Email',
    name: 'suppressionEmail',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'recipient@example.com',
    displayOptions: {
      show: {
        resource: ['suppressions'],
        operation: ['create'],
      },
    },
    description:
      'The email address to add to the suppression list. Resend will skip this address at send time to avoid new hard bounces or spam complaints.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('suppressionEmail', index) as string;

  const body: IDataObject = { email };

  const response = await apiRequest.call(this, 'POST', '/suppressions', body);

  return [{ json: response, pairedItem: { item: index } }];
}
