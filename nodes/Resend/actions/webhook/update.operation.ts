import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest, assertHttpsEndpoint } from '../../transport';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';
import { webhookEventOptions } from './index';

export const description: INodeProperties[] = [
  createDynamicIdField({
    fieldName: 'webhookId',
    resourceName: 'webhook',
    displayName: 'Webhook',
    required: true,
    placeholder: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
    description:
      'The unique identifier of the webhook to update. Obtain from the Create Webhook response or List Webhooks operation.',
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['update'],
      },
    },
  }),
  {
    displayName: 'Update Fields',
    name: 'webhookUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Endpoint',
        name: 'endpoint',
        type: 'string',
        default: '',
        placeholder: 'https://example.com/webhooks/resend',
        description:
          'New HTTPS URL where Resend will send webhook event notifications. Must be accessible from the internet.',
      },
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        default: ['email.sent'],
        options: webhookEventOptions,
        description:
          'Update which email events should trigger webhook notifications',
      },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        default: 'enabled',
        options: [
          { name: 'Enabled', value: 'enabled' },
          { name: 'Disabled', value: 'disabled' },
        ],
        description:
          'Enable or disable the webhook. Disabled webhooks will not receive any event notifications.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const webhookId = resolveDynamicIdValue(this, 'webhookId', index);
  const updateFields = this.getNodeParameter(
    'webhookUpdateFields',
    index,
    {},
  ) as {
    endpoint?: string;
    events?: string[];
    status?: string;
  };

  if (updateFields.endpoint) {
    assertHttpsEndpoint(this.getNode(), updateFields.endpoint);
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/webhooks/${encodeURIComponent(webhookId)}`,
    updateFields,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
