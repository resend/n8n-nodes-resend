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
        resource: ['contactProperties'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description:
          'Create a new custom contact property (metadata field) for storing additional information about contacts',
        action: 'Create a contact property',
      },
      {
        name: 'Delete',
        value: 'delete',
        description:
          'Permanently delete a contact property. This removes the property from all contacts.',
        action: 'Delete a contact property',
      },
      {
        name: 'Get',
        value: 'get',
        description:
          'Retrieve details of a specific contact property including its name, type, and configuration',
        action: 'Get contact property details',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get all custom contact properties defined for storing contact metadata',
        action: 'List all contact properties',
      },
      {
        name: 'Update',
        value: 'update',
        description: "Update a contact property's name or configuration",
        action: 'Update a contact property',
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
