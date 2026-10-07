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
        resource: ['inboxDrafts'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description:
          'Create an unsent draft, either for a new conversation or as a reply in a thread',
        action: 'Create an inbox draft',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete an unsent draft',
        action: 'Delete an inbox draft',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Retrieve a draft',
        action: 'Get an inbox draft',
      },
      {
        name: 'List',
        value: 'list',
        description: 'List unsent drafts, most recently updated first',
        action: 'List inbox drafts',
      },
      {
        name: 'Send',
        value: 'send',
        description:
          'Send a draft. The draft must have at least one recipient.',
        action: 'Send an inbox draft',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update the recipients, subject, or body of a draft',
        action: 'Update an inbox draft',
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
