import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Email Address',
    name: 'inboxEmailAddress',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'support@example.com',
    displayOptions: {
      show: {
        resource: ['inboxes'],
        operation: ['create'],
      },
    },
    description:
      'The inbox address on one of your domains. The domain must be verified for sending, and for receiving unless forwarding is enabled.',
  },
  {
    displayName: 'Additional Fields',
    name: 'inboxCreateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxes'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Forwarding',
        name: 'forwarding',
        type: 'boolean',
        default: false,
        description:
          'Whether Resend should provision a receiving address so mail can be received without adding an MX record',
      },
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
          'Internal name for the inbox. Recipients do not see it. Defaults to the email address.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const emailAddress = this.getNodeParameter(
    'inboxEmailAddress',
    index,
  ) as string;
  const fields = this.getNodeParameter('inboxCreateFields', index, {}) as {
    forwarding?: boolean;
    fromName?: string;
    name?: string;
  };

  const body: IDataObject = { email_address: emailAddress };

  if (fields.name) {
    body.name = fields.name;
  }
  if (fields.fromName) {
    body.from_name = fields.fromName;
  }
  if (fields.forwarding !== undefined) {
    body.forwarding = fields.forwarding;
  }

  const response = await apiRequest.call(this, 'POST', '/inboxes', body);

  return [{ json: response, pairedItem: { item: index } }];
}
