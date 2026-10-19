import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Event ID or Name',
    name: 'eventIdentifier',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'user.created',
    displayOptions: {
      show: {
        resource: ['events'],
        operation: ['update'],
      },
    },
    description: 'The ID or name of the event to update',
  },
  {
    displayName: 'Schema (JSON)',
    name: 'eventSchema',
    type: 'json',
    required: true,
    default: '',
    placeholder: '{"plan":"string","amount":"number"}',
    displayOptions: {
      show: {
        resource: ['events'],
        operation: ['update'],
      },
    },
    description:
      'The schema for the event payload, as an object with flat key/type pairs. Supported types: string, number, boolean, date. Set to null to remove the existing schema.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const identifier = this.getNodeParameter('eventIdentifier', index) as string;
  const schemaRaw = this.getNodeParameter('eventSchema', index) as
    | string
    | object;

  const body: IDataObject = {};
  if (schemaRaw === null || schemaRaw === 'null') {
    body.schema = null;
  } else {
    body.schema =
      typeof schemaRaw === 'string' && schemaRaw.trim()
        ? JSON.parse(schemaRaw)
        : schemaRaw;
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/events/${encodeURIComponent(identifier)}`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
