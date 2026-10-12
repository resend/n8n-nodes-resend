import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export function createWebhookEventIdField(operation: string): INodeProperties {
  return {
    displayName: 'Event ID',
    name: 'webhookEventId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'msg_1srOrx2ZWZBpBUvZwXKQmoEYga2',
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: [operation],
      },
    },
    description:
      'The ID of the webhook event. Obtain it from the List Events operation.',
  };
}

export function getWebhookEventId(
  context: IExecuteFunctions,
  index: number,
): string {
  const eventId = String(
    context.getNodeParameter('webhookEventId', index) ?? '',
  ).trim();
  if (!eventId) {
    throw new NodeOperationError(context.getNode(), 'Event ID is required', {
      itemIndex: index,
    });
  }
  return eventId;
}
