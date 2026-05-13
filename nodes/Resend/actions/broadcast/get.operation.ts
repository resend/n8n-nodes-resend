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
    fieldName: 'broadcastId',
    resourceName: 'broadcast',
    displayName: 'Broadcast',
    required: true,
    placeholder: 'bc_123456',
    description:
      'The unique identifier of the broadcast to retrieve. Obtain from the Create Broadcast response or List Broadcasts operation. Returns full broadcast details including content and status.',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['get'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const broadcastId = resolveDynamicIdValue(this, 'broadcastId', index);

  const response = await apiRequest.call(
    this,
    'GET',
    `/broadcasts/${encodeURIComponent(broadcastId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
