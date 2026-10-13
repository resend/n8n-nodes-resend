import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  assertRecipientLimit,
  assignRecipients,
  assignStrings,
  attachmentsField,
  bccField,
  buildAttachments,
  ccField,
  createInboxField,
  getThreadEmailPath,
  idempotencyHeaders,
  idempotencyKeyField,
  threadEmailIdField,
  threadIdField,
} from './shared';

const show = {
  resource: ['inboxThreads'],
  operation: ['reply'],
};

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['reply']),
  threadIdField(['reply']),
  threadEmailIdField(
    ['reply'],
    'The ID of the email to reply to, as returned by the List Emails operation',
  ),
  {
    displayName: 'HTML Content',
    name: 'html',
    type: 'string',
    default: '',
    typeOptions: {
      rows: 4,
    },
    placeholder: '<p>Your reply</p>',
    displayOptions: { show },
    description:
      'The HTML body of the reply. At least one of HTML Content or Text Content is required.',
  },
  {
    displayName: 'Text Content',
    name: 'text',
    type: 'string',
    default: '',
    typeOptions: {
      rows: 4,
    },
    displayOptions: { show },
    description:
      'The plain-text body of the reply. At least one of HTML Content or Text Content is required.',
  },
  {
    displayName: 'Additional Options',
    name: 'inboxReplyOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: { show },
    options: [
      attachmentsField(
        'Files to attach, as on Email → Send. Up to 10 files. The content of all files can total at most 25 MB. A URL file counts toward the 10 files only, because it is fetched when the email is sent.',
      ),
      bccField,
      ccField,
      idempotencyKeyField(
        'A unique key to ensure the reply is sent only once. Useful for retries to prevent duplicate sends. A retry with the same key within 24 hours returns the first response. Reusing the key with a different body, or while the first request is still running, returns a 409.',
      ),
      {
        displayName: 'Reply All',
        name: 'replyAll',
        type: 'boolean',
        default: false,
        description:
          'Whether to reply to everyone on the original email. For a received email, the reply goes to its Reply-To or its sender and copies its other To and CC addresses. For a sent email, it goes to its Reply-To when that is not the inbox address, else to its To, and copies its CC. The inbox address and duplicates are excluded.',
      },
      {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        description:
          'The subject of the reply. Defaults to the thread subject prefixed with "Re:".',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const html = this.getNodeParameter('html', index, '') as string;
  const text = this.getNodeParameter('text', index, '') as string;
  const options = this.getNodeParameter(
    'inboxReplyOptions',
    index,
    {},
  ) as IDataObject;

  if (!html && !text) {
    throw new NodeOperationError(
      this.getNode(),
      'At least one of HTML Content or Text Content is required',
      { itemIndex: index },
    );
  }

  const body: IDataObject = {};
  assignStrings(body, { html, text }, ['html', 'text']);
  assignRecipients(body, options, ['cc', 'bcc']);
  assertRecipientLimit(this, body, index);
  assignStrings(body, options, ['subject']);
  if (options.replyAll === true) {
    body.reply_all = true;
  }
  const attachments = await buildAttachments(this, options.attachments, index);
  if (attachments) {
    body.attachments = attachments;
  }

  const response = await apiRequest.call(
    this,
    'POST',
    `${getThreadEmailPath(this, index)}/reply`,
    body,
    undefined,
    idempotencyHeaders(options),
  );

  return [{ json: response, pairedItem: { item: index } }];
}
