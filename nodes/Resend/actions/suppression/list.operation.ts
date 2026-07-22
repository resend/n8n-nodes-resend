import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { createListExecutionData, requestList } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['suppressions'],
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
        resource: ['suppressions'],
        operation: ['list'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  {
    displayName: 'Origin',
    name: 'suppressionOrigin',
    type: 'options',
    default: '',
    displayOptions: {
      show: {
        resource: ['suppressions'],
        operation: ['list'],
      },
    },
    options: [
      {
        name: 'Any',
        value: '',
        description: 'Return suppressions from all origins',
      },
      {
        name: 'Bounce',
        value: 'bounce',
        description: 'Addresses suppressed because they hard bounced',
      },
      {
        name: 'Complaint',
        value: 'complaint',
        description: 'Addresses suppressed because of a spam complaint',
      },
      {
        name: 'Manual',
        value: 'manual',
        description: 'Addresses suppressed manually via the API or dashboard',
      },
    ],
    description: 'Filter suppressions by how they were added to the list',
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const origin = this.getNodeParameter('suppressionOrigin', 0, '') as string;

  const extraQs: IDataObject = {};
  if (origin) {
    extraQs.origin = origin;
  }

  const items = await requestList.call(this, '/suppressions', extraQs);
  return createListExecutionData.call(this, items);
}
