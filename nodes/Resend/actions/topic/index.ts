import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as list from './list.operation';
import * as update from './update.operation';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['topics'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description:
          'Create a new subscription topic for organizing email preferences and managing unsubscribe options',
        action: 'Create a subscription topic',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Permanently delete a subscription topic by its topic ID',
        action: 'Delete a topic',
      },
      {
        name: 'Get',
        value: 'get',
        description:
          'Retrieve details of a specific topic including its name, description, and subscriber count',
        action: 'Get topic details',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get all subscription topics with their names, IDs, and subscriber counts',
        action: 'List all topics',
      },
      {
        name: 'Update',
        value: 'update',
        description: "Update a topic's name or description",
        action: 'Update a topic',
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
  ...update.description,
  ...del.description,
];

export { execute } from './execute';
export { create, del as delete, get, list, update };
