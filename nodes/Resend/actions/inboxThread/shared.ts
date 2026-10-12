import type {
  IDataObject,
  IExecuteFunctions,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { normalizeEmailList, normalizeIdList } from '../../transport';
import { createDynamicIdField } from '../../utils/dynamicFields';
import { inboxPath } from '../inbox/fields';

export function createInboxField(
  resource: string,
  operations: string[],
): INodeProperties {
  return createDynamicIdField({
    fieldName: 'inboxId',
    resourceName: 'inbox',
    displayName: 'Inbox',
    required: true,
    description:
      'Select an inbox or enter an ID directly. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: [resource],
        operation: operations,
      },
    },
  });
}

export function createIdField(
  options: {
    name: string;
    displayName: string;
    description: string;
    placeholder?: string;
  },
  resource: string,
  operations: string[],
): INodeProperties {
  return {
    displayName: options.displayName,
    name: options.name,
    type: 'string',
    required: true,
    default: '',
    placeholder: options.placeholder,
    description: options.description,
    displayOptions: {
      show: {
        resource: [resource],
        operation: operations,
      },
    },
  };
}

export const threadIdField = (operations: string[]): INodeProperties =>
  createIdField(
    {
      name: 'inboxThreadId',
      displayName: 'Thread ID',
      description: 'The ID of the thread',
      placeholder: '4d8e2a1c-9b3f-4c6d-8a21-3e5f7c9c0d12',
    },
    'inboxThreads',
    operations,
  );

export const threadEmailIdField = (
  operations: string[],
  description = 'The ID of the email in the thread, as returned by the List Emails operation',
): INodeProperties =>
  createIdField(
    {
      name: 'inboxEmailId',
      displayName: 'Email ID',
      description,
      placeholder: '5b1a9f47-2c8d-4e6f-9a03-1d2e3f4a5b60',
    },
    'inboxThreads',
    operations,
  );

export const draftIdField = (operations: string[]): INodeProperties =>
  createIdField(
    {
      name: 'inboxDraftId',
      displayName: 'Draft ID',
      description: 'The ID of the draft',
      placeholder: 'c3a1e8b4-2d5f-4a7c-9e10-6b8d7f5a4c32',
    },
    'inboxDrafts',
    operations,
  );

export function createListFields(
  resource: string,
  operation: string,
): INodeProperties[] {
  return [
    {
      displayName: 'Return All',
      name: 'returnAll',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          resource: [resource],
          operation: [operation],
        },
      },
      description: 'Whether to return all results or only up to a given limit',
    },
    {
      displayName: 'Limit',
      name: 'limit',
      type: 'number',
      typeOptions: {
        minValue: 1,
      },
      default: 50,
      displayOptions: {
        show: {
          resource: [resource],
          operation: [operation],
          returnAll: [false],
        },
      },
      description: 'Max number of results to return',
    },
  ];
}

export function getRequiredString(
  context: IExecuteFunctions,
  name: string,
  label: string,
  index: number,
): string {
  const value = String(context.getNodeParameter(name, index, '') ?? '').trim();
  if (!value) {
    throw new NodeOperationError(context.getNode(), `${label} is required`, {
      itemIndex: index,
    });
  }
  return value;
}

export function getInboxPath(
  context: IExecuteFunctions,
  index: number,
): string {
  return inboxPath(context, index);
}

export function getThreadPath(
  context: IExecuteFunctions,
  index: number,
): string {
  const threadId = getRequiredString(
    context,
    'inboxThreadId',
    'Thread ID',
    index,
  );
  return `${getInboxPath(context, index)}/threads/${encodeURIComponent(threadId)}`;
}

export function getThreadEmailPath(
  context: IExecuteFunctions,
  index: number,
): string {
  const emailId = getRequiredString(context, 'inboxEmailId', 'Email ID', index);
  return `${getThreadPath(context, index)}/emails/${encodeURIComponent(emailId)}`;
}

export function getDraftPath(
  context: IExecuteFunctions,
  index: number,
): string {
  const draftId = getRequiredString(context, 'inboxDraftId', 'Draft ID', index);
  return `${getInboxPath(context, index)}/drafts/${encodeURIComponent(draftId)}`;
}

export function assignRecipients(
  body: IDataObject,
  fields: IDataObject,
  keys: string[],
): void {
  for (const key of keys) {
    const value = fields[key] as string | string[] | undefined;
    if (value === undefined || value === '') continue;
    const list = normalizeEmailList(value);
    if (list.length) {
      body[key] = list;
    }
  }
}

export const MAX_INBOX_RECIPIENTS = 50;

export function assertRecipientLimit(
  context: IExecuteFunctions,
  body: IDataObject,
  index: number,
): void {
  let total = 0;
  for (const key of ['to', 'cc', 'bcc']) {
    const value = body[key];
    if (Array.isArray(value)) total += value.length;
  }
  if (total > MAX_INBOX_RECIPIENTS) {
    throw new NodeOperationError(
      context.getNode(),
      `To, CC, and BCC combined cannot exceed ${MAX_INBOX_RECIPIENTS} recipients (got ${total})`,
      { itemIndex: index },
    );
  }
}

export function assignStrings(
  body: IDataObject,
  fields: IDataObject,
  keys: string[],
): void {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === 'string' && value !== '') {
      body[key] = value;
    }
  }
}

export const THREAD_FOLDER_OPTIONS = [
  { name: 'Archive', value: 'archive' },
  { name: 'Inbox', value: 'inbox' },
  { name: 'Sent', value: 'sent' },
  { name: 'Spam', value: 'spam' },
  { name: 'Trash', value: 'trash' },
];

export const threadFilterOptions: INodeProperties[] = [
  {
    displayName: 'Folders',
    name: 'folders',
    type: 'multiOptions',
    default: [],
    options: THREAD_FOLDER_OPTIONS,
    description:
      'A thread is returned when any of its emails is in one of the folders. Defaults to Inbox, or to Inbox, Archive, and Sent when Label Names or IDs is set. Spam and Trash are only included when you name them.',
  },
  {
    displayName: 'Label Names or IDs',
    name: 'labels',
    type: 'multiOptions',
    default: [],
    typeOptions: {
      loadOptionsMethod: 'getInboxLabels',
      loadOptionsDependsOn: ['inboxId.value'],
    },
    description:
      'Returns threads with any of these labels. Up to 50 IDs. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
  },
  {
    displayName: 'Read',
    name: 'read',
    type: 'options',
    default: 'true',
    options: [
      {
        name: 'Read',
        value: 'true',
        description: 'Threads where every email is read',
      },
      {
        name: 'Unread',
        value: 'false',
        description: 'Threads with at least one unread email',
      },
    ],
    description: 'Filter threads by their read state',
  },
];

export function buildThreadFilterQuery(filters: IDataObject): IDataObject {
  const qs: IDataObject = {};
  const folders = normalizeIdList(filters.folders as string | string[]);
  if (folders) {
    qs.folders = folders;
  }
  const labels = normalizeIdList(filters.labels as string | string[]);
  if (labels) {
    qs.labels = labels;
  }
  if (filters.read !== undefined && filters.read !== '') {
    qs.read = String(filters.read);
  }
  return qs;
}

export const htmlField: INodeProperties = {
  displayName: 'HTML',
  name: 'html',
  type: 'string',
  default: '',
  typeOptions: {
    rows: 4,
  },
  description: 'The HTML body',
};

export const textField: INodeProperties = {
  displayName: 'Text',
  name: 'text',
  type: 'string',
  default: '',
  typeOptions: {
    rows: 4,
  },
  description: 'The plain-text body',
};

export const ccField: INodeProperties = {
  displayName: 'CC',
  name: 'cc',
  type: 'string',
  default: '',
  description:
    'CC recipient email addresses. Comma-separated for multiple addresses.',
};

export const bccField: INodeProperties = {
  displayName: 'BCC',
  name: 'bcc',
  type: 'string',
  default: '',
  description:
    'BCC recipient email addresses. Comma-separated for multiple addresses.',
};
