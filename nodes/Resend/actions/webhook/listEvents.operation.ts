import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { requestList } from '../../transport';
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
    description: 'The webhook to list delivered events for',
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['listEvents'],
      },
    },
  }),
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['webhooks'],
        operation: ['listEvents'],
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
        operation: ['listEvents'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const webhookId = resolveDynamicIdValue(this, 'webhookId', index);

  const items = await requestList.call(
    this,
    `/webhooks/${encodeURIComponent(webhookId)}/events`,
    undefined,
    index,
  );
  return items.map((item) => ({ json: item, pairedItem: { item: index } }));
}
