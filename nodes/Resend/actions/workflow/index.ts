import type { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as getRun from './getRun.operation';
import * as getRunStep from './getRunStep.operation';
import * as list from './list.operation';
import * as listRunSteps from './listRunSteps.operation';
import * as listRuns from './listRuns.operation';
import * as update from './update.operation';

export { execute } from './execute';
export {
  create,
  del as delete,
  get,
  getRun,
  getRunStep,
  list,
  listRunSteps,
  listRuns,
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
        resource: ['workflows'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new workflow to automate email sequences',
        action: 'Create a workflow',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Remove an existing workflow',
        action: 'Delete a workflow',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Retrieve a single workflow with its steps and edges',
        action: 'Get workflow details',
      },
      {
        name: 'Get Run',
        value: 'getRun',
        description: 'Retrieve a single workflow run',
        action: 'Get a workflow run',
      },
      {
        name: 'Get Run Step',
        value: 'getRunStep',
        description: 'Retrieve a single workflow run step',
        action: 'Get a workflow run step',
      },
      {
        name: 'List',
        value: 'list',
        description: 'Retrieve a list of workflows',
        action: 'List all workflows',
      },
      {
        name: 'List Run Steps',
        value: 'listRunSteps',
        description: 'Retrieve a list of workflow run steps',
        action: 'List workflow run steps',
      },
      {
        name: 'List Runs',
        value: 'listRuns',
        description: 'Retrieve a list of workflow runs',
        action: 'List workflow runs',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update an existing workflow (enable or disable)',
        action: 'Update a workflow',
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
  ...listRuns.description,
  ...getRun.description,
  ...listRunSteps.description,
  ...getRunStep.description,
];
