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
  bccField,
  ccField,
  createInboxField,
  getInboxPath,
  htmlField,
  textField,
} from '../inboxThread/shared';

export const description: INodeProperties[] = [
  createInboxField('inboxDrafts', ['create']),
  {
    displayName: 'Draft Fields',
    name: 'inboxDraftFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxDrafts'],
        operation: ['create'],
      },
    },
    options: [
      bccField,
      ccField,
      htmlField,
      {
        displayName: 'Reply To Email ID',
        name: 'replyToEmailId',
        type: 'string',
        default: '',
        description:
          'The ID of the thread email this draft replies to. Must be set together with Thread ID.',
      },
      {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        description: 'The subject of the draft. Max 2000 characters.',
      },
      textField,
      {
        displayName: 'Thread ID',
        name: 'threadId',
        type: 'string',
        default: '',
        description:
          'The ID of the thread to reply in. Must be set together with Reply To Email ID. Omit to start a new conversation.',
      },
      {
        displayName: 'To',
        name: 'to',
        type: 'string',
        default: '',
        description:
          'Recipient email addresses. Comma-separated for multiple addresses.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const fields = this.getNodeParameter(
    'inboxDraftFields',
    index,
    {},
  ) as IDataObject;

  const body: IDataObject = {};
  assignRecipients(body, fields, ['to', 'cc', 'bcc']);
  assertRecipientLimit(this, body, index);
  assignStrings(body, fields, ['subject', 'html', 'text']);

  if (Object.keys(body).length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'At least one of To, CC, BCC, Subject, HTML, or Text must be set',
      { itemIndex: index },
    );
  }

  const threadId = String(fields.threadId ?? '').trim();
  const replyToEmailId = String(fields.replyToEmailId ?? '').trim();
  if (Boolean(threadId) !== Boolean(replyToEmailId)) {
    throw new NodeOperationError(
      this.getNode(),
      'Thread ID and Reply To Email ID must be set together',
      { itemIndex: index },
    );
  }
  if (threadId) {
    body.thread_id = threadId;
    body.reply_to_email_id = replyToEmailId;
  }

  const response = await apiRequest.call(
    this,
    'POST',
    `${getInboxPath(this, index)}/drafts`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
