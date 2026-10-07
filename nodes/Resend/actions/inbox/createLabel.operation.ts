import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { inboxIdField, inboxPath, LABEL_COLOR_OPTIONS } from './fields';

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
      {
        displayName: 'Color',
        name: 'color',
        type: 'options',
        default: 'cyan',
        options: LABEL_COLOR_OPTIONS,
        description: 'The color of the label',
      },
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

  if (fields.color) {
    body.color = fields.color;
  }

  const response = await apiRequest.call(
    this,
    'POST',
    inboxPath(this, index, '/labels'),
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
