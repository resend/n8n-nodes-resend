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
    fieldName: 'topicId',
    resourceName: 'topic',
    displayName: 'Topic',
    required: true,
    placeholder: 'topic_123456',
    description:
      'The topic to delete. This action is permanent and cannot be undone.',
    displayOptions: {
      show: {
        resource: ['topics'],
        operation: ['delete'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const topicId = resolveDynamicIdValue(this, 'topicId', index);

  const response = await apiRequest.call(
    this,
    'DELETE',
    `/topics/${encodeURIComponent(topicId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
