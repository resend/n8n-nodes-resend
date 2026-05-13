import type {
  IDataObject,
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
    fieldName: 'broadcastId',
    resourceName: 'broadcast',
    displayName: 'Broadcast',
    required: true,
    placeholder: 'bc_123456',
    description:
      'The unique identifier of the broadcast to send. Obtain from the Create Broadcast response. The broadcast will be sent to all contacts in its target segment.',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['send'],
      },
    },
  }),
  {
    displayName: 'Send Options',
    name: 'broadcastSendOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['send'],
      },
    },
    options: [
      {
        displayName: 'Scheduled At',
        name: 'scheduledAt',
        type: 'string',
        default: '',
        placeholder: 'in 1 min',
        description:
          'Schedule the broadcast for future delivery. Accepts natural language (e.g., "in 1 hour", "tomorrow at 9am") or ISO 8601 format. Leave empty to send immediately.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const broadcastId = resolveDynamicIdValue(this, 'broadcastId', index);
  const sendOptions = this.getNodeParameter(
    'broadcastSendOptions',
    index,
    {},
  ) as {
    scheduledAt?: string;
  };

  const body: IDataObject = {};

  if (sendOptions.scheduledAt) {
    body.scheduled_at = sendOptions.scheduledAt;
  }

  const response = await apiRequest.call(
    this,
    'POST',
    `/broadcasts/${encodeURIComponent(broadcastId)}/send`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
