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
        operation: ['listContacts'],
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
        resource: ['segments'],
        operation: ['listContacts'],
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
        resource: ['segments'],
        operation: ['listContacts'],
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
  const segmentId = resolveDynamicIdValue(this, 'segmentId', index);

  const items = await requestList.call(
    this,
    `/segments/${encodeURIComponent(segmentId)}/contacts`,
    undefined,
    index,
  );
  return items.map((item) => ({ json: item, pairedItem: { item: index } }));
}
