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
        resource: ['contacts'],
        operation: ['listImports'],
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
        operation: ['listImports'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  {
    displayName: 'Filters',
    name: 'contactImportFilters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['listImports'],
      },
    },
    options: [
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        default: 'queued',
        description: 'Filter contact imports by status',
        options: [
          {
            name: 'Completed',
            value: 'completed',
            description: 'The import finished processing',
          },
          {
            name: 'Failed',
            value: 'failed',
            description: 'The import could not be processed',
          },
          {
            name: 'In Progress',
            value: 'in_progress',
            description: 'The import is currently being processed',
          },
          {
            name: 'Queued',
            value: 'queued',
            description: 'The import is waiting to be processed',
          },
        ],
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const filters = this.getNodeParameter('contactImportFilters', 0, {}) as {
    status?: string;
  };

  const extraQs: IDataObject = {};
  if (filters.status) {
    extraQs.status = filters.status;
  }

  const items = await requestList.call(this, '/contacts/imports', extraQs);
  return createListExecutionData.call(this, items);
}
