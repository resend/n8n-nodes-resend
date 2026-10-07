import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { inboxIdField, inboxPath } from './fields';

export const description: INodeProperties[] = [
  inboxIdField('update', 'The inbox to update'),
  {
    displayName: 'Update Fields',
    name: 'inboxUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxes'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'From Name',
        name: 'fromName',
        type: 'string',
        default: '',
        placeholder: 'Ada from Support',
        description:
          'The name recipients see when mail is sent from this inbox. Use a plain name, not a full "Name and address" sender.',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        placeholder: 'Customer Support',
        description:
          'New internal name for the inbox. Recipients do not see it.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const fields = this.getNodeParameter('inboxUpdateFields', index, {}) as {
    fromName?: string;
    name?: string;
  };

  const body: IDataObject = {};

  if (fields.name) {
    body.name = fields.name;
  }
  if (fields.fromName) {
    body.from_name = fields.fromName;
  }

  if (Object.keys(body).length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'Set at least one of Name or From Name to update the inbox',
      { itemIndex: index },
    );
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    inboxPath(this, index),
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
