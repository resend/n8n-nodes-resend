import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { createListExecutionData, requestList } from '../../transport';
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
    description: 'The webhook the event was delivered to',
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['listEventAttempts'],
      },
    },
  }),
  createWebhookEventIdField('listEventAttempts'),
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['listEventAttempts'],
      },
    },
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    typeOptions: {
      minValue: 1,
    },
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['listEventAttempts'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const webhookId = resolveDynamicIdValue(this, 'webhookId', 0);
  const eventId = getWebhookEventId(this, 0);

  const items = await requestList.call(
    this,
    `/webhooks/${encodeURIComponent(webhookId)}/events/${encodeURIComponent(eventId)}/attempts`,
  );
  return createListExecutionData.call(this, items);
}
