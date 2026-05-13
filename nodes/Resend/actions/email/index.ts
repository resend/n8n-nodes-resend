import { type INodeProperties, SEND_AND_WAIT_OPERATION } from 'n8n-workflow';
import * as cancel from './cancel.operation';
import * as getAttachment from './getAttachment.operation';
import * as list from './list.operation';
import * as listAttachments from './listAttachments.operation';
import * as retrieve from './retrieve.operation';
import * as send from './send.operation';
import * as sendAndWait from './sendAndWait.operation';
import * as sendBatch from './sendBatch.operation';
import * as update from './update.operation';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['email'],
      },
    },
    options: [
      {
        name: 'Cancel',
        value: 'cancel',
        description:
          'Cancel a previously scheduled email by its email ID before it gets sent',
        action: 'Cancel a scheduled email',
      },
      {
        name: 'Get Attachment',
        value: 'getAttachment',
        description:
          'Download a specific attachment from a sent email using the email ID and attachment ID',
        action: 'Get attachment from email',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get a list of all previously sent emails with their status, subject, and recipients',
        action: 'List all sent emails',
      },
      {
        name: 'List Attachments',
        value: 'listAttachments',
        description:
          'Get all attachments from a sent email by providing the email ID',
        action: 'List email attachments',
      },
      {
        name: 'Retrieve',
        value: 'retrieve',
        description:
          'Get details of a specific sent email including subject, recipients, status, and timestamps',
        action: 'Get email details',
      },
      {
        name: 'Send',
        value: 'send',
        description:
          'Send a new email to one or more recipients with HTML or plain text content, attachments, and optional scheduling',
        action: 'Send a new email',
      },
      {
        name: 'Send and Wait for Response',
        value: SEND_AND_WAIT_OPERATION,
        description:
          'Send an email with response buttons and pause workflow execution until the recipient clicks a response',
        action: 'Send email and wait for recipient response',
      },
      {
        name: 'Send Batch',
        value: 'sendBatch',
        description:
          'Send up to 100 emails in a single API call for bulk email delivery with individual customization',
        action: 'Send multiple emails in batch',
      },
      {
        name: 'Update',
        value: 'update',
        description:
          'Reschedule a scheduled email by updating its scheduled_at time before it is sent',
        action: 'Update scheduled email time',
      },
    ],
    default: 'send',
  },
];

export const descriptions: INodeProperties[] = [
  ...operations,
  ...send.description,
  ...sendAndWait.description,
  ...sendBatch.description,
  ...list.description,
  ...retrieve.description,
  ...update.description,
  ...cancel.description,
  ...listAttachments.description,
  ...getAttachment.description,
];

export { execute } from './execute';
export {
  cancel,
  getAttachment,
  list,
  listAttachments,
  retrieve,
  send,
  sendAndWait,
  sendBatch,
  update,
};
