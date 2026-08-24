import type {
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
  createDynamicIdField({
    fieldName: 'broadcastIdClickedLinks',
    resourceName: 'broadcast',
    displayName: 'Broadcast',
    required: true,
    placeholder: 'bc_123456',
    description:
      'Select a broadcast or enter an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['listClickedLinks'],
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
        resource: ['broadcasts'],
        operation: ['listClickedLinks'],
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
        resource: ['broadcasts'],
        operation: ['listClickedLinks'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const broadcastId = resolveDynamicIdValue(this, 'broadcastIdClickedLinks', 0);

  const items = await requestList.call(
    this,
    `/broadcasts/${encodeURIComponent(broadcastId)}/clicked-links`,
  );
  return createListExecutionData.call(this, items);
}
