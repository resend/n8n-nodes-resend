import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as createLabel from './createLabel.operation';
import * as del from './delete.operation';
import * as deleteLabel from './deleteLabel.operation';
import * as get from './get.operation';
import * as getAgent from './getAgent.operation';
import * as list from './list.operation';
import * as listLabels from './listLabels.operation';
import * as update from './update.operation';
import * as updateAgent from './updateAgent.operation';
import * as updateLabel from './updateLabel.operation';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['inboxes'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description:
          'Create an inbox to send, receive, and organize email at an address on one of your domains',
        action: 'Create an inbox',
      },
      {
        name: 'Create Label',
        value: 'createLabel',
        description: 'Create a named, colored label on an inbox',
        action: 'Create an inbox label',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Permanently delete an inbox',
        action: 'Delete an inbox',
      },
      {
        name: 'Delete Label',
        value: 'deleteLabel',
        description: 'Permanently delete a label from an inbox',
        action: 'Delete an inbox label',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Retrieve an inbox by its ID or email address',
        action: 'Get an inbox',
      },
      {
        name: 'Get Agent Settings',
        value: 'getAgent',
        description:
          "Retrieve the AI agent's instructions, tone, and enabled actions for an inbox",
        action: 'Get inbox agent settings',
      },
      {
        name: 'List',
        value: 'list',
        description: 'List all inboxes, newest first',
        action: 'List inboxes',
      },
      {
        name: 'List Labels',
        value: 'listLabels',
        description: 'List every label on an inbox, oldest first',
        action: 'List inbox labels',
      },
      {
        name: 'Update',
        value: 'update',
        description: "Update an inbox's internal name or from name",
        action: 'Update an inbox',
      },
      {
        name: 'Update Agent Settings',
        value: 'updateAgent',
        description:
          "Update the AI agent's instructions, tone, or enabled actions for an inbox",
        action: 'Update inbox agent settings',
      },
      {
        name: 'Update Label',
        value: 'updateLabel',
        description: "Update a label's name or color",
        action: 'Update an inbox label',
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
  ...getAgent.description,
  ...updateAgent.description,
  ...createLabel.description,
  ...listLabels.description,
  ...updateLabel.description,
  ...deleteLabel.description,
];

export { execute } from './execute';
export {
  create,
  createLabel,
  del as delete,
  deleteLabel,
  get,
  getAgent,
  list,
  listLabels,
  update,
  updateAgent,
  updateLabel,
};
