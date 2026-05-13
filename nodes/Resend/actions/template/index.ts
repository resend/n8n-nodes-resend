import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as duplicate from './duplicate.operation';
import * as get from './get.operation';
import * as list from './list.operation';
import * as publish from './publish.operation';
import * as update from './update.operation';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['templates'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description:
          'Create a new reusable email template with HTML content and dynamic variables for personalization',
        action: 'Create an email template',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Permanently delete an email template by its template ID',
        action: 'Delete a template',
      },
      {
        name: 'Duplicate',
        value: 'duplicate',
        description:
          'Create a copy of an existing template with a new name for easy customization',
        action: 'Duplicate a template',
      },
      {
        name: 'Get',
        value: 'get',
        description:
          "Retrieve a template's details including HTML content, variables, and publish status by template ID",
        action: 'Get template details',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get all email templates with their names, IDs, and publish status',
        action: 'List all templates',
      },
      {
        name: 'Publish',
        value: 'publish',
        description:
          'Publish a template to make it available for sending emails. Required before a template can be used in email operations.',
        action: 'Publish a template',
      },
      {
        name: 'Update',
        value: 'update',
        description:
          "Update a template's name, subject, HTML content, or variables",
        action: 'Update a template',
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
  ...publish.description,
  ...duplicate.description,
];

export { execute } from './execute';
export { create, del as delete, duplicate, get, list, publish, update };
