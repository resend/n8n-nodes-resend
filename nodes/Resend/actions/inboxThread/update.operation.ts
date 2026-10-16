import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { createInboxField, getThreadPath, threadIdField } from './shared';

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['update']),
  threadIdField(['update']),
  {
    displayName: 'Update Fields',
    name: 'inboxThreadUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    description:
      'Changes apply in this order: read, then folder. They are not atomic. To change the labels of a thread, use the Add Labels, Set Labels, or Remove Label operations.',
    displayOptions: {
      show: {
        resource: ['inboxThreads'],
        operation: ['update'],
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
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const updateFields = this.getNodeParameter(
    'inboxThreadUpdateFields',
    index,
    {},
  ) as {
    folder?: string;
    read?: boolean;
  };

  const body: IDataObject = {};
  if (typeof updateFields.read === 'boolean') {
    body.read = updateFields.read;
  }
  if (updateFields.folder) {
    body.folder = updateFields.folder;
  }
  if (Object.keys(body).length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'At least one of Folder or Read must be set',
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
