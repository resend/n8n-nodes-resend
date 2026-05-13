import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';

export const description: INodeProperties[] = [
  createDynamicIdField({
    fieldName: 'webhookId',
    resourceName: 'webhook',
    displayName: 'Webhook',
    required: true,
    placeholder: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
    description:
      'The unique identifier of the webhook to retrieve. Obtain from the Create Webhook response or List Webhooks operation. Returns webhook details including endpoint URL, events, and status.',
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['get'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const webhookId = resolveDynamicIdValue(this, 'webhookId', index);

  const response = await apiRequest.call(
    this,
    'GET',
    `/webhooks/${encodeURIComponent(webhookId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
