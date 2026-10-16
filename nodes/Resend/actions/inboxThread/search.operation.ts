import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { normalizeIdList, requestList } from '../../transport';
import {
  buildThreadFilterQuery,
  createInboxField,
  createListFields,
  getInboxPath,
  threadFilterOptions,
} from './shared';

const MAX_QUERY_LENGTH = 256;
const MAX_ADDRESS_VALUES = 20;

const addressOption = (
  name: string,
  displayName: string,
  description: string,
): INodeProperties => ({
  displayName,
  name,
  type: 'string',
  default: '',
  description,
});

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['search']),
  {
    displayName: 'Query',
    name: 'inboxThreadSearchQuery',
    type: 'string',
    default: '',
    placeholder: 'invoice -draft',
    displayOptions: {
      show: {
        resource: ['inboxThreads'],
        operation: ['search'],
      },
    },
    description:
      'Free text to search for in the subject, body, sender, recipients, and attachment names. Every word must match. Wrap words in double quotes to match an exact phrase. Start a word or quoted phrase with - to exclude it. Max 256 characters and 32 words.',
  },
  ...createListFields('inboxThreads', 'search'),
  {
    displayName: 'Filters',
    name: 'inboxThreadSearchFilters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxThreads'],
        operation: ['search'],
      },
    },
    options: [
      addressOption(
        'bcc',
        'BCC',
        'Comma-separated BCC recipients, matched the same way as From. Up to 20 values.',
      ),
      addressOption(
        'cc',
        'CC',
        'Comma-separated CC recipients, matched the same way as From. Up to 20 values.',
      ),
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'string',
        default: '',
        placeholder: '2026-09-30',
        description:
          'Matches emails sent on or before this date. Same formats as Start Date. A date covers that whole day. A timestamp is used as given.',
      },
      {
        ...threadFilterOptions[0],
        description:
          'A thread is returned when any of its emails is in one of the folders. When an email filter or the query is set, the matching email itself must be in one of the folders, and for Sent it must be an email the inbox sent. Defaults to Inbox, or to Inbox, Archive, and Sent when Label Names or IDs is set. Spam and Trash are only included when you name them.',
      },
      addressOption(
        'from',
        'From',
        "Comma-separated senders. Each value matches part of the sender's address or name, without case. Returns threads that match any of them. Up to 20 values.",
      ),
      {
        displayName: 'Has Attachment',
        name: 'hasAttachment',
        type: 'options',
        default: 'true',
        options: [
          {
            name: 'With Attachment',
            value: 'true',
            description: 'Emails with an attachment',
          },
          {
            name: 'Without Attachment',
            value: 'false',
            description: 'Emails without an attachment',
          },
        ],
        description: 'Filter emails by whether they have an attachment',
      },
      ...threadFilterOptions.slice(1),
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'string',
        default: '',
        placeholder: '2026-09-01',
        description:
          'Matches emails sent on or after this date. Accepts a date like 2026-09-01 or an ISO 8601 timestamp, in UTC unless the timestamp has an offset.',
      },
      addressOption(
        'to',
        'To',
        'Comma-separated recipients, matched the same way as From. Up to 20 values.',
      ),
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const query = String(
    this.getNodeParameter('inboxThreadSearchQuery', index, '') ?? '',
  ).trim();
  if (query.length > MAX_QUERY_LENGTH) {
    throw new NodeOperationError(
      this.getNode(),
      `Query must be at most ${MAX_QUERY_LENGTH} characters (got ${query.length})`,
      { itemIndex: index },
    );
  }
  const filters = this.getNodeParameter(
    'inboxThreadSearchFilters',
    index,
    {},
  ) as IDataObject;

  const qs: IDataObject = buildThreadFilterQuery(filters);
  if (query) {
    qs.query = query;
  }
  for (const [key, label] of [
    ['from', 'From'],
    ['to', 'To'],
    ['cc', 'CC'],
    ['bcc', 'BCC'],
  ]) {
    const values = normalizeIdList(filters[key] as string | string[]);
    if (!values) continue;
    const count = values.split(',').length;
    if (count > MAX_ADDRESS_VALUES) {
      throw new NodeOperationError(
        this.getNode(),
        `${label} accepts at most ${MAX_ADDRESS_VALUES} values (got ${count})`,
        { itemIndex: index },
      );
    }
    qs[key] = values;
  }
  if (filters.hasAttachment !== undefined && filters.hasAttachment !== '') {
    qs.has_attachment = String(filters.hasAttachment);
  }
  for (const [key, param] of [
    ['startDate', 'start_date'],
    ['endDate', 'end_date'],
  ]) {
    const value = String(filters[key] ?? '').trim();
    if (value) {
      qs[param] = value;
    }
  }

  const items = await requestList.call(
    this,
    `${getInboxPath(this, index)}/threads/search`,
    qs,
    index,
  );
  return items.map((item) => ({ json: item, pairedItem: { item: index } }));
}
