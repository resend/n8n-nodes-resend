import type { INodeProperties } from 'n8n-workflow';
import * as batchAdd from './batchAdd.operation';
import * as batchRemove from './batchRemove.operation';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as list from './list.operation';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['suppressions'],
      },
    },
    options: [
      {
        name: 'Batch Add',
        value: 'batchAdd',
        description:
          'Add up to 100 email addresses to the suppression list in a single request',
        action: 'Batch add suppressions',
      },
      {
        name: 'Batch Remove',
        value: 'batchRemove',
        description:
          'Remove up to 100 suppressions at once by email address or by suppression ID',
        action: 'Batch remove suppressions',
      },
      {
        name: 'Create',
        value: 'create',
        description:
          'Add a single email address to the suppression list so Resend skips it at send time',
        action: 'Create a suppression',
      },
      {
        name: 'Delete',
        value: 'delete',
        description:
          'Remove a single suppression by ID or email so Resend can send to the address again',
        action: 'Delete a suppression',
      },
      {
        name: 'Get',
        value: 'get',
        description:
          'Retrieve a single suppression by ID or email, including its origin and creation time',
        action: 'Get a suppression',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'List suppressed addresses, optionally filtered by origin (bounce, complaint, or manual)',
        action: 'List suppressions',
      },
    ],
    default: 'list',
  },
];

export const descriptions: INodeProperties[] = [
  ...operations,
  ...create.description,
  ...get.description,
  ...list.description,
  ...del.description,
  ...batchAdd.description,
  ...batchRemove.description,
];

export { execute } from './execute';
export { batchAdd, batchRemove, create, del as delete, get, list };
