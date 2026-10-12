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
      'The webhook whose signing secret should be rotated. The previous secret keeps verifying payloads for 24 hours.',
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['rotateSigningSecret'],
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
    'POST',
    `/webhooks/${encodeURIComponent(webhookId)}/signing-secret/rotate`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
