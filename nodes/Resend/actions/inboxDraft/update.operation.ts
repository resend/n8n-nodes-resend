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
  buildDraftAttachments,
  ccField,
  createInboxField,
  draftAttachmentsField,
  draftIdField,
  getDraftPath,
  htmlField,
  textField,
} from '../inboxThread/shared';

export const description: INodeProperties[] = [
  createInboxField('inboxDrafts', ['update']),
  draftIdField(['update']),
  {
    displayName: 'Update Fields',
    name: 'inboxDraftUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxDrafts'],
        operation: ['update'],
      },
    },
    options: [
      draftAttachmentsField(
        'Files to store on the draft, from binary data. They replace every attachment on the draft. Each one needs a file name and a content type. The files of a draft can total at most 25 MB. An empty file or a blocked file type returns an error.',
      ),
      bccField,
      ccField,
      {
        displayName: 'Clear Fields',
        name: 'clearFields',
        type: 'multiOptions',
        default: [],
        options: [
          { name: 'Attachments', value: 'attachments' },
          { name: 'BCC', value: 'bcc' },
          { name: 'CC', value: 'cc' },
          { name: 'HTML', value: 'html' },
          { name: 'Subject', value: 'subject' },
          { name: 'Text', value: 'text' },
          { name: 'To', value: 'to' },
        ],
        description:
          'Fields to clear on the draft. Attachments removes every attachment. Overrides a value set for the same field.',
      },
      htmlField,
      {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        description: 'The subject of the draft. Max 2000 characters.',
      },
      textField,
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
    'inboxDraftUpdateFields',
    index,
    {},
  ) as IDataObject;

  const clearFields = Array.isArray(fields.clearFields)
    ? (fields.clearFields as string[])
    : [];

  const body: IDataObject = {};
  assignRecipients(body, fields, ['to', 'cc', 'bcc']);
  assignStrings(body, fields, ['subject', 'html', 'text']);
  if (!clearFields.includes('attachments')) {
    const attachments = await buildDraftAttachments(
      this,
      fields.attachments,
      index,
    );
    if (attachments) {
      body.attachments = attachments;
    }
  }
  for (const key of clearFields) {
    body[key] = key === 'attachments' ? [] : null;
  }
  assertRecipientLimit(this, body, index);

  if (Object.keys(body).length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'At least one of To, CC, BCC, Subject, HTML, Text, Attachments, or Clear Fields must be set',
      { itemIndex: index },
    );
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    getDraftPath(this, index),
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
