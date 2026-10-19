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
import { createWebhookEventIdField, getWebhookEventId } from './shared';

export const description: INodeProperties[] = [
  createDynamicIdField({
    fieldName: 'webhookId',
    resourceName: 'webhook',
    displayName: 'Webhook',
    required: true,
    placeholder: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
    description:
      'The webhook to redeliver the event to. The webhook must be enabled.',
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['replayEvent'],
      },
    },
  }),
  createWebhookEventIdField('replayEvent'),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const webhookId = resolveDynamicIdValue(this, 'webhookId', index);
  const eventId = getWebhookEventId(this, index);

  const response = await apiRequest.call(
    this,
    'POST',
    `/webhooks/${encodeURIComponent(webhookId)}/events/${encodeURIComponent(eventId)}/replay`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
