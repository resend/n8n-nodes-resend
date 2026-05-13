import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest, assertHttpsEndpoint } from '../../transport';
import { webhookEventOptions } from './index';

export const description: INodeProperties[] = [
  {
    displayName: 'Endpoint',
    name: 'webhookEndpoint',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'https://example.com/webhooks/resend',
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['create'],
      },
    },
    description:
      'The public HTTPS URL where Resend will send webhook event notifications. Must be accessible from the internet and use HTTPS.',
  },
  {
    displayName: 'Events',
    name: 'webhookEvents',
    type: 'multiOptions',
    required: true,
    default: ['email.sent'],
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['create'],
      },
    },
    options: webhookEventOptions,
    description:
      'Select which email events should trigger webhook notifications. Common events include email.sent, email.delivered, email.opened, and email.bounced.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const endpoint = this.getNodeParameter('webhookEndpoint', index) as string;
  const events = this.getNodeParameter('webhookEvents', index) as string[];

  assertHttpsEndpoint(this.getNode(), endpoint);

  const body: IDataObject = {
    endpoint,
    events,
  };

  const response = await apiRequest.call(this, 'POST', '/webhooks', body);

  return [{ json: response, pairedItem: { item: index } }];
}
