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
      'The unique identifier of the webhook to delete. This action is permanent and the webhook will immediately stop receiving events.',
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['delete'],
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
    'DELETE',
    `/webhooks/${encodeURIComponent(webhookId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
