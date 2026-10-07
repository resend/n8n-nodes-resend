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
        operation: ['update'],
      },
    },
  }),
  {
    displayName: 'Segment Name',
    name: 'segmentUpdateName',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'Registered Users',
    displayOptions: {
      show: {
        resource: ['segments'],
        operation: ['update'],
      },
    },
    description: 'The new name of the segment',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const segmentId = resolveDynamicIdValue(this, 'segmentId', index);
  const name = this.getNodeParameter('segmentUpdateName', index) as string;

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/segments/${encodeURIComponent(segmentId)}`,
    { name },
  );

  return [{ json: response, pairedItem: { item: index } }];
}
