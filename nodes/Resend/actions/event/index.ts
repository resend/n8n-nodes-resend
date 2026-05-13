import type { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as list from './list.operation';
import * as send from './send.operation';
import * as update from './update.operation';

export { execute } from './execute';
export { create, del as delete, get, list, send, update };

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['events'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new event that can be used to trigger workflows',
        action: 'Create an event',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Remove an existing event by ID or name',
        action: 'Delete an event',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Retrieve a single event by ID or name',
        action: 'Get event details',
      },
      {
        name: 'List',
        value: 'list',
        description: 'Retrieve a list of events',
        action: 'List all events',
      },
      {
        name: 'Send',
        value: 'send',
        description: 'Send a named event to trigger matching workflows',
        action: 'Send an event',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update an existing event schema',
        action: 'Update an event',
      },
    ],
    default: 'list',
  },
];

export const descriptions: INodeProperties[] = [
  ...operations,
  ...create.description,
  ...send.description,
  ...get.description,
  ...list.description,
  ...update.description,
  ...del.description,
];
