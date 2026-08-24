import type { INodeProperties } from 'n8n-workflow';
import * as cancel from './cancel.operation';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as list from './list.operation';
import * as listRecipients from './listRecipients.operation';
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
        name: 'Cancel',
        value: 'cancel',
        description:
          'Cancel a broadcast campaign that is queued or scheduled before it is delivered to its audience',
        action: 'Cancel a broadcast',
      },
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
        name: 'List Recipients',
        value: 'listRecipients',
        description:
          'Get the recipients of a broadcast filtered by event type, such as delivered, opened, clicked, or bounced',
        action: 'List broadcast recipients',
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
  ...listRecipients.description,
  ...update.description,
  ...del.description,
  ...send.description,
  ...cancel.description,
];

export { execute } from './execute';
export {
  cancel,
  create,
  del as delete,
  get,
  list,
  listRecipients,
  send,
  update,
};
