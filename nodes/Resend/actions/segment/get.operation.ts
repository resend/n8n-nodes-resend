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
    fieldName: 'segmentId',
    resourceName: 'segment',
    displayName: 'Segment',
    required: true,
    placeholder: 'seg_123456',
    description:
      'Select a segment or enter an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['segments'],
        operation: ['get'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const segmentId = resolveDynamicIdValue(this, 'segmentId', index);

  const response = await apiRequest.call(
    this,
    'GET',
    `/segments/${encodeURIComponent(segmentId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
