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
      'The unique identifier of the broadcast to duplicate. Any broadcast can be duplicated, including sent ones.',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['duplicate'],
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
    'POST',
    `/broadcasts/${encodeURIComponent(broadcastId)}/duplicate`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
