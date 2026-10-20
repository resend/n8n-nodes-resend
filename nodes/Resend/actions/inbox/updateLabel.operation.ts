import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  inboxIdField,
  labelColorOption,
  labelIdField,
  labelPath,
  readLabelColor,
} from './fields';

export const description: INodeProperties[] = [
  inboxIdField('updateLabel', 'The inbox the label belongs to'),
  labelIdField('updateLabel', 'The label to update'),
  {
    displayName: 'Update Fields',
    name: 'inboxLabelUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxes'],
        operation: ['updateLabel'],
      },
    },
    options: [
      labelColorOption(
        'A new color for the label, as a #RRGGBB hex color. It is stored in uppercase.',
      ),
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'A new name for the label',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const fields = this.getNodeParameter('inboxLabelUpdateFields', index, {}) as {
    color?: string;
    name?: string;
  };

  const body: IDataObject = {};

  if (fields.name) {
    body.name = fields.name;
  }
  const color = readLabelColor(this, fields.color, index);
  if (color) {
    body.color = color;
  }

  if (Object.keys(body).length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'Set at least one of Name or Color to update the label',
      { itemIndex: index },
    );
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    labelPath(this, index),
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
