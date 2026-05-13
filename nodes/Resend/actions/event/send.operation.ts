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
        operation: ['send'],
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
        operation: ['send'],
      },
    },
    description:
      'The name of the event to trigger. Must match the event name configured in a workflow trigger step.',
  },
  {
    displayName: 'Identify By',
    name: 'identifyBy',
    type: 'options',
    required: true,
    options: [
      { name: 'Contact ID', value: 'contactId' },
      { name: 'Email', value: 'email' },
    ],
    default: 'email',
    displayOptions: {
      show: {
        resource: ['events'],
        operation: ['send'],
      },
    },
    description: 'Whether to identify the contact by ID or email address',
  },
  {
    displayName: 'Contact ID',
    name: 'contactId',
    type: 'string',
    required: true,
    default: '',
    placeholder: '7f2e4a3b-dfbc-4e9a-8b2c-5f3a1d6e7c8b',
    displayOptions: {
      show: {
        resource: ['events'],
        operation: ['send'],
        identifyBy: ['contactId'],
      },
    },
    description: 'The ID of the contact to run the workflow for',
  },
  {
    displayName: 'Email',
    name: 'contactEmail',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'user@example.com',
    displayOptions: {
      show: {
        resource: ['events'],
        operation: ['send'],
        identifyBy: ['email'],
      },
    },
    description: 'The email address to run the workflow for',
  },
  {
    displayName: 'Payload (JSON)',
    name: 'eventPayload',
    type: 'json',
    default: '',
    displayOptions: {
      show: {
        resource: ['events'],
        operation: ['send'],
      },
    },
    description:
      'An optional object containing custom data to pass to the workflow. This data can be used in template variables and conditions.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const event = this.getNodeParameter('eventName', index) as string;
  const identifyBy = this.getNodeParameter('identifyBy', index) as string;

  const body: IDataObject = { event };

  if (identifyBy === 'contactId') {
    body.contactId = this.getNodeParameter('contactId', index) as string;
  } else {
    body.email = this.getNodeParameter('contactEmail', index) as string;
  }

  const payloadRaw = this.getNodeParameter('eventPayload', index, '') as
    | string
    | object;
  if (payloadRaw) {
    body.payload =
      typeof payloadRaw === 'string' && payloadRaw.trim()
        ? JSON.parse(payloadRaw)
        : payloadRaw;
  }

  const response = await apiRequest.call(this, 'POST', '/events/send', body);

  return [{ json: response, pairedItem: { item: index } }];
}
