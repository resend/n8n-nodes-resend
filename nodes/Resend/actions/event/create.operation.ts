import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

const BETA_NOTICE =
  'Workflows and Events are currently in private alpha and only available to a limited number of users. APIs might change before GA. <a href="https://resend.com/contact">Contact us</a> if you\'re interested in testing this feature.';

export const description: INodeProperties[] = [
  {
    displayName: BETA_NOTICE,
    name: 'eventBetaNotice',
    type: 'notice',
    default: '',
    displayOptions: {
      show: {
        resource: ['events'],
        operation: ['create'],
      },
    },
  },
  {
    displayName: 'Event Name',
    name: 'eventName',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'user.created',
    displayOptions: {
      show: {
        resource: ['events'],
        operation: ['create'],
      },
    },
    description:
      'The name of the event. Used to match events to workflow triggers. Dot notation is recommended but not required. Event names cannot start with the "resend:" prefix.',
  },
  {
    displayName: 'Schema (JSON)',
    name: 'eventSchema',
    type: 'json',
    default: '',
    displayOptions: {
      show: {
        resource: ['events'],
        operation: ['create'],
      },
    },
    description:
      'An optional schema definition for the event payload. Must be an object with flat key/type pairs. Supported types: string, number, boolean, date. Example: {"plan": "string", "trial": "boolean"}',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('eventName', index) as string;
  const schemaRaw = this.getNodeParameter('eventSchema', index, '') as
    | string
    | object;

  const body: IDataObject = { name };

  if (schemaRaw) {
    body.schema =
      typeof schemaRaw === 'string' && schemaRaw.trim()
        ? JSON.parse(schemaRaw)
        : schemaRaw;
  }

  const response = await apiRequest.call(this, 'POST', '/events', body);

  return [{ json: response, pairedItem: { item: index } }];
}
