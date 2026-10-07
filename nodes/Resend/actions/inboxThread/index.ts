import type { INodeProperties } from 'n8n-workflow';

import * as del from './delete.operation';
import * as forward from './forward.operation';
import * as get from './get.operation';
import * as getEmail from './getEmail.operation';
import * as list from './list.operation';
import * as listEmails from './listEmails.operation';
import * as reply from './reply.operation';
import * as update from './update.operation';

export { execute } from './execute';
export {
  del as delete,
  forward,
  get,
  getEmail,
  list,
  listEmails,
  reply,
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
        resource: ['inboxThreads'],
      },
    },
    options: [
      {
        name: 'Delete',
        value: 'delete',
        description:
          'Move a thread to the trash folder. It is permanently deleted after 30 days.',
        action: 'Delete an inbox thread',
      },
      {
        name: 'Forward',
        value: 'forward',
        description: 'Forward an email in a thread to new recipients',
        action: 'Forward an inbox thread email',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Retrieve a thread summary',
        action: 'Get an inbox thread',
      },
      {
        name: 'Get Email',
        value: 'getEmail',
        description: 'Retrieve a single email from a thread',
        action: 'Get an inbox thread email',
      },
      {
        name: 'List',
        value: 'list',
        description: 'List the threads in one folder of an inbox',
        action: 'List inbox threads',
      },
      {
        name: 'List Emails',
        value: 'listEmails',
        description: 'List the emails in a thread, oldest first',
        action: 'List inbox thread emails',
      },
      {
        name: 'Reply',
        value: 'reply',
        description: 'Send a reply to an email in a thread',
        action: 'Reply to an inbox thread email',
      },
      {
        name: 'Update',
        value: 'update',
        description:
          'Mark a thread read or unread, move it to another folder, or apply a label',
        action: 'Update an inbox thread',
      },
    ],
    default: 'list',
  },
];

export const descriptions: INodeProperties[] = [
  ...operations,
  ...list.description,
  ...get.description,
  ...update.description,
  ...del.description,
  ...listEmails.description,
  ...getEmail.description,
  ...reply.description,
  ...forward.description,
];
