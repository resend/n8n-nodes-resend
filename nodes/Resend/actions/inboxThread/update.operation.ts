import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, normalizeEmailList } from '../../transport';
import { createInboxField, getThreadPath, threadIdField } from './shared';

const MAX_LABEL_CHANGES = 10;

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['update']),
  threadIdField(['update']),
  {
    displayName: 'Update Fields',
    name: 'inboxThreadUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxThreads'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Add Label Names or IDs',
        name: 'addLabelIds',
        type: 'multiOptions',
        default: [],
        typeOptions: {
          loadOptionsMethod: 'getInboxLabels',
          loadOptionsDependsOn: ['inboxId.value'],
        },
        description:
          'Labels to apply to the thread. Between 1 and 10 IDs. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: 'Folder',
        name: 'folder',
        type: 'options',
        default: 'inbox',
        options: [
          { name: 'Archive', value: 'archive' },
          { name: 'Inbox', value: 'inbox' },
          { name: 'Spam', value: 'spam' },
          { name: 'Trash', value: 'trash' },
        ],
        description:
          'Move the thread to this folder. Sent is assigned automatically and cannot be set. Moving a thread out of Trash restores it.',
      },
      {
        displayName: 'Read',
        name: 'read',
        type: 'boolean',
        default: true,
        description: 'Whether to mark every email in the thread as read',
      },
      {
        displayName: 'Remove Label Names or IDs',
        name: 'removeLabelIds',
        type: 'multiOptions',
        default: [],
        typeOptions: {
          loadOptionsMethod: 'getInboxLabels',
          loadOptionsDependsOn: ['inboxId.value'],
        },
        description:
          'Labels to remove from the thread. Between 1 and 10 IDs. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
    ],
  },
];

function readLabelIds(
  context: IExecuteFunctions,
  value: unknown,
  label: string,
  index: number,
): string[] {
  const ids = normalizeEmailList(value as string | string[] | undefined);
  if (ids.length > MAX_LABEL_CHANGES) {
    throw new NodeOperationError(
      context.getNode(),
      `${label} accepts at most ${MAX_LABEL_CHANGES} label IDs (got ${ids.length})`,
      { itemIndex: index },
    );
  }
  return ids;
}

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const updateFields = this.getNodeParameter(
    'inboxThreadUpdateFields',
    index,
    {},
  ) as {
    addLabelIds?: unknown;
    folder?: string;
    read?: boolean;
    removeLabelIds?: unknown;
  };

  const body: IDataObject = {};
  if (typeof updateFields.read === 'boolean') {
    body.read = updateFields.read;
  }
  if (updateFields.folder) {
    body.folder = updateFields.folder;
  }
  const addLabelIds = readLabelIds(
    this,
    updateFields.addLabelIds,
    'Add Labels',
    index,
  );
  if (addLabelIds.length) {
    body.add_label_ids = addLabelIds;
  }
  const removeLabelIds = readLabelIds(
    this,
    updateFields.removeLabelIds,
    'Remove Labels',
    index,
  );
  if (removeLabelIds.length) {
    body.remove_label_ids = removeLabelIds;
  }

  const overlap = addLabelIds.find((id) => removeLabelIds.includes(id));
  if (overlap) {
    throw new NodeOperationError(
      this.getNode(),
      `A label ID cannot be both added and removed in the same request (${overlap})`,
      { itemIndex: index },
    );
  }

  if (Object.keys(body).length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'At least one of Add Labels, Folder, Read, or Remove Labels must be set',
      { itemIndex: index },
    );
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    getThreadPath(this, index),
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
