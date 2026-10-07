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
  bccField,
  ccField,
  createInboxField,
  getThreadEmailPath,
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

  const response = await apiRequest.call(
    this,
    'POST',
    `${getThreadEmailPath(this, index)}/forward`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
