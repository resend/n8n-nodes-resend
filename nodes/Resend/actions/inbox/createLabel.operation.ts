import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  inboxIdField,
  inboxPath,
  labelColorOption,
  readLabelColor,
} from './fields';

export const description: INodeProperties[] = [
  inboxIdField('createLabel', 'The inbox to create the label in'),
  {
    displayName: 'Label Name',
    name: 'inboxLabelName',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'Urgent',
    displayOptions: {
      show: {
        resource: ['inboxes'],
        operation: ['createLabel'],
      },
    },
    description: 'The name of the label',
  },
  {
    displayName: 'Additional Fields',
    name: 'inboxLabelCreateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxes'],
        operation: ['createLabel'],
      },
    },
    options: [
      labelColorOption(
        'The color of the label, as a #RRGGBB hex color. It is stored in uppercase. When omitted, a random color from the dashboard palette is used.',
      ),
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('inboxLabelName', index) as string;
  const fields = this.getNodeParameter('inboxLabelCreateFields', index, {}) as {
    color?: string;
  };

  const body: IDataObject = { name };

  const color = readLabelColor(this, fields.color, index);
  if (color) {
    body.color = color;
  }

  const response = await apiRequest.call(
    this,
    'POST',
    inboxPath(this, index, '/labels'),
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
