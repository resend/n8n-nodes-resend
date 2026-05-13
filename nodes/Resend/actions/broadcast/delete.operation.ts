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
      'The unique identifier of the broadcast to delete. This action is permanent and cannot be undone. Only unsent broadcasts can be deleted.',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['delete'],
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
    'DELETE',
    `/broadcasts/${encodeURIComponent(broadcastId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
