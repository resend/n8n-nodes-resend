import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { createListExecutionData, requestList } from '../../transport';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';

export const description: INodeProperties[] = [
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['list'],
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
        resource: ['contacts'],
        operation: ['list'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  createDynamicIdField({
    fieldName: 'segmentIdFilter',
    resourceName: 'segment',
    displayName: 'Filter by Segment',
    required: false,
    placeholder: 'seg_123456',
    description:
      'Only return contacts belonging to this segment. Leave empty to return all contacts.',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['list'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const segmentId = resolveDynamicIdValue(this, 'segmentIdFilter', 0);
  const extraQs: IDataObject = {};
  if (segmentId) {
    extraQs.segment_id = segmentId;
  }
  const items = await requestList.call(this, '/contacts', extraQs);
  return createListExecutionData.call(this, items);
}
