import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { createListExecutionData, requestList } from '../../transport';
import {
  createInboxField,
  createLabelOption,
  createListFields,
  extractLocatorValue,
  getInboxPath,
} from './shared';

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['list']),
  ...createListFields('inboxThreads', 'list'),
  {
    displayName: 'Filters',
    name: 'inboxThreadFilters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxThreads'],
        operation: ['list'],
      },
    },
    options: [
      {
        displayName: 'Folder',
        name: 'folder',
        type: 'options',
        default: 'inbox',
        options: [
          { name: 'Archive', value: 'archive' },
          { name: 'Inbox', value: 'inbox' },
          { name: 'Sent', value: 'sent' },
          { name: 'Spam', value: 'spam' },
          { name: 'Trash', value: 'trash' },
        ],
        description: 'The folder to list threads from',
      },
      createLabelOption(
        'label',
        'Label',
        'Only return threads with this label. Choose from the list, or specify a label ID.',
      ),
      {
        displayName: 'Search Query',
        name: 'query',
        type: 'string',
        default: '',
        description:
          'Case-insensitive substring matched against the thread subject and its label names. Max 256 characters.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const filters = this.getNodeParameter(
    'inboxThreadFilters',
    0,
    {},
  ) as IDataObject;

  const qs: IDataObject = {};
  for (const key of ['folder', 'label', 'query']) {
    const value = extractLocatorValue(filters[key]);
    if (value) {
      qs[key] = value;
    }
  }

  const items = await requestList.call(
    this,
    `${getInboxPath(this, 0)}/threads`,
    qs,
  );
  return createListExecutionData.call(this, items);
}
