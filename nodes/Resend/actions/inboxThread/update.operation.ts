import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  createInboxField,
  createLabelOption,
  extractLocatorValue,
  getThreadPath,
  threadIdField,
} from './shared';

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
        description: 'Move the thread to this folder',
      },
      createLabelOption(
        'labelId',
        'Label',
        'Apply this label to the thread. Choose from the list, or specify a label ID.',
      ),
      {
        displayName: 'Read',
        name: 'read',
        type: 'boolean',
        default: true,
        description: 'Whether to mark every message in the thread as read',
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
  ) as { folder?: string; labelId?: unknown; read?: boolean };

  const body: IDataObject = {};
  if (typeof updateFields.read === 'boolean') {
    body.read = updateFields.read;
  }
  if (updateFields.folder) {
    body.folder = updateFields.folder;
  }
  const labelId = extractLocatorValue(updateFields.labelId);
  if (labelId) {
    body.label_id = labelId;
  }

  if (Object.keys(body).length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'At least one of Folder, Label, or Read must be set',
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
