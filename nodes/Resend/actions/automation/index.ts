import type { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as del from './delete.operation';
import * as duplicate from './duplicate.operation';
import * as get from './get.operation';
import * as getRun from './getRun.operation';
import * as list from './list.operation';
import * as listRuns from './listRuns.operation';
import * as stop from './stop.operation';
import * as update from './update.operation';

export { execute } from './execute';
export {
  create,
  del as delete,
  duplicate,
  get,
  getRun,
  list,
  listRuns,
  stop,
  update,
};

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['automations'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new automation to automate email sequences',
        action: 'Create an automation',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Remove an existing automation',
        action: 'Delete an automation',
      },
      {
        name: 'Duplicate',
        value: 'duplicate',
        description: 'Create a copy of an existing automation',
        action: 'Duplicate an automation',
      },
      {
        name: 'Get',
        value: 'get',
        description:
          'Retrieve a single automation with its steps and connections',
        action: 'Get automation details',
      },
      {
        name: 'Get Run',
        value: 'getRun',
        description: 'Retrieve a single automation run',
        action: 'Get an automation run',
      },
      {
        name: 'List',
        value: 'list',
        description: 'Retrieve a list of automations',
        action: 'List all automations',
      },
      {
        name: 'List Runs',
        value: 'listRuns',
        description: 'Retrieve a list of automation runs',
        action: 'List automation runs',
      },
      {
        name: 'Stop',
        value: 'stop',
        description: 'Stop a running automation and disable it',
        action: 'Stop an automation',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update an existing automation (enable or disable)',
        action: 'Update an automation',
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
  ...duplicate.description,
  ...stop.description,
  ...listRuns.description,
  ...getRun.description,
];
