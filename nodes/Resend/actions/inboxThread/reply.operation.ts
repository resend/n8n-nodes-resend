import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
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
      bccField,
      ccField,
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
  assignStrings(body, options, ['subject']);

  const response = await apiRequest.call(
    this,
    'POST',
    `${getThreadEmailPath(this, index)}/reply`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
