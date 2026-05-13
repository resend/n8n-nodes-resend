import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as list from './list.operation';
import * as send from './send.operation';
import * as update from './update.operation';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['broadcasts'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description:
          'Create a new email broadcast campaign with subject, content, and target audience for bulk email sending',
        action: 'Create a broadcast campaign',
      },
      {
        name: 'Delete',
        value: 'delete',
        description:
          'Permanently delete a broadcast campaign by its broadcast ID',
        action: 'Delete a broadcast',
      },
      {
        name: 'Get',
        value: 'get',
        description:
          'Retrieve details of a specific broadcast including status, subject, audience, and send statistics',
        action: 'Get broadcast details',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get a list of all broadcast campaigns with their status, subject lines, and creation dates',
        action: 'List all broadcasts',
      },
      {
        name: 'Send',
        value: 'send',
        description:
          'Trigger the sending of a broadcast campaign to its target audience immediately or at a scheduled time',
        action: 'Send a broadcast',
      },
      {
        name: 'Update',
        value: 'update',
        description:
          "Update a broadcast's subject, content, audience, or schedule before it is sent",
        action: 'Update a broadcast',
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
  ...send.description,
];

export { execute } from './execute';
export { create, del as delete, get, list, send, update };
