import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, normalizeEmailList } from '../../transport';
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
  operation: ['forward'],
};

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['forward']),
  threadIdField(['forward']),
  threadEmailIdField(
    ['forward'],
    'The ID of the email to forward, as returned by the List Emails operation',
  ),
  {
    displayName: 'To',
    name: 'to',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'colleague@example.com',
    displayOptions: { show },
    description:
      'Recipient email addresses. Comma-separated for multiple addresses. To, CC, and BCC combined cannot exceed 50 recipients.',
  },
  {
    displayName: 'Additional Options',
    name: 'inboxForwardOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: { show },
    options: [
      attachmentsField(
        'Files to attach, as on Email → Send. The forward also sends the attachments of the original email. Together they can have up to 10 files and at most 25 MB of content. A URL file counts toward the 10 files only. An original attachment that was sent from a URL cannot be forwarded, and the request returns an error.',
      ),
      bccField,
      ccField,
      {
        displayName: 'HTML Note',
        name: 'html',
        type: 'string',
        default: '',
        typeOptions: {
          rows: 4,
        },
        description: 'An HTML note sent above the quoted original',
      },
      idempotencyKeyField(
        'A unique key to ensure the forward is sent only once. Useful for retries to prevent duplicate sends. A retry with the same key within 24 hours returns the first response. Reusing the key with a different body, or while the first request is still running, returns a 409.',
      ),
      {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        description:
          'The subject of the forward. Defaults to the thread subject prefixed with "Fwd:".',
      },
      {
        displayName: 'Text Note',
        name: 'text',
        type: 'string',
        default: '',
        typeOptions: {
          rows: 4,
        },
        description: 'A plain-text note sent above the quoted original',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const to = normalizeEmailList(
    this.getNodeParameter('to', index, '') as string | string[],
  );
  if (!to.length) {
    throw new NodeOperationError(
      this.getNode(),
      'At least one recipient is required in To',
      { itemIndex: index },
    );
  }
  const options = this.getNodeParameter(
    'inboxForwardOptions',
    index,
    {},
  ) as IDataObject;

  const body: IDataObject = { to };
  assignRecipients(body, options, ['cc', 'bcc']);
  assertRecipientLimit(this, body, index);
  assignStrings(body, options, ['html', 'text', 'subject']);
  const attachments = await buildAttachments(this, options.attachments, index);
  if (attachments) {
    body.attachments = attachments;
  }

  const response = await apiRequest.call(
    this,
    'POST',
    `${getThreadEmailPath(this, index)}/forward`,
    body,
    undefined,
    idempotencyHeaders(options),
  );

  return [{ json: response, pairedItem: { item: index } }];
}
