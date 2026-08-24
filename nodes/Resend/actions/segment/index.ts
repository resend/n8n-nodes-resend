import type { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as getMetrics from './getMetrics.operation';
import * as list from './list.operation';
import * as listContacts from './listContacts.operation';

export { execute } from './execute';
export { create, del as delete, get, getMetrics, list, listContacts };

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['segments'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description:
          'Create a new contact segment for grouping contacts based on criteria or manual assignment',
        action: 'Create a contact segment',
      },
      {
        name: 'Delete',
        value: 'delete',
        description:
          'Permanently delete a segment by its segment ID. Contacts in the segment are not deleted.',
        action: 'Delete a segment',
      },
      {
        name: 'Get',
        value: 'get',
        description:
          'Retrieve details of a specific segment including its name, contact count, and creation date',
        action: 'Get segment details',
      },
      {
        name: 'Get Metrics',
        value: 'getMetrics',
        description:
          'Retrieve contact count metrics for the account, optionally broken down by segment',
        action: 'Get segment metrics',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get all segments in the account with their names, IDs, and contact counts',
        action: 'List all segments',
      },
      {
        name: 'List Contacts',
        value: 'listContacts',
        description: 'Get all contacts belonging to a specific segment',
        action: 'List segment contacts',
      },
    ],
    default: 'list',
  },
];

export const descriptions: INodeProperties[] = [
  ...operations,
  ...create.description,
  ...get.description,
  ...getMetrics.description,
  ...list.description,
  ...listContacts.description,
  ...del.description,
];
