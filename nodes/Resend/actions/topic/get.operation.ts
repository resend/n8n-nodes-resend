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
    description: 'The topic to retrieve',
    displayOptions: {
      show: {
        resource: ['topics'],
        operation: ['get'],
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
    'GET',
    `/topics/${encodeURIComponent(topicId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
