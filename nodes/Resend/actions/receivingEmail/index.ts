import type { INodeProperties } from 'n8n-workflow';

import * as get from './get.operation';
import * as getAttachment from './getAttachment.operation';
import * as list from './list.operation';
import * as listAttachments from './listAttachments.operation';

export { execute } from './execute';
export { get, getAttachment, list, listAttachments };

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['receivingEmails'],
      },
    },
    options: [
      {
        name: 'Get',
        value: 'get',
        description:
          'Retrieve a specific received email including sender, subject, body, and headers by email ID',
        action: 'Get received email details',
      },
      {
        name: 'Get Attachment',
        value: 'getAttachment',
        description:
          'Download a specific attachment from a received email by email ID and attachment ID',
        action: 'Download attachment from received email',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get all emails received through inbound email processing with sender, subject, and timestamps',
        action: 'List all received emails',
      },
      {
        name: 'List Attachments',
        value: 'listAttachments',
        description:
          'Get all attachments from a received email including filenames, sizes, and content types',
        action: 'List attachments from received email',
      },
    ],
    default: 'list',
  },
];

export const descriptions: INodeProperties[] = [
  ...operations,
  ...list.description,
  ...get.description,
  ...listAttachments.description,
  ...getAttachment.description,
];
