import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Topic Name',
    name: 'topicName',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'Weekly Newsletter',
    displayOptions: {
      show: {
        resource: ['topics'],
        operation: ['create'],
      },
    },
    description:
      'A descriptive name for the topic (e.g., Weekly Newsletter, Product Updates). Topics allow contacts to manage their email preferences.',
  },
  {
    displayName: 'Default Subscription',
    name: 'topicDefaultSubscription',
    type: 'options',
    required: true,
    default: 'opt_in',
    displayOptions: {
      show: {
        resource: ['topics'],
        operation: ['create'],
      },
    },
    options: [
      { name: 'Opt In', value: 'opt_in' },
      { name: 'Opt Out', value: 'opt_out' },
    ],
    description:
      'Default subscription status for new contacts. Opt In means contacts must explicitly subscribe; Opt Out means they are subscribed by default.',
  },
  {
    displayName: 'Create Options',
    name: 'topicCreateOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['topics'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description:
          'A brief description of the topic shown to contacts on the preference page. Helps them understand what emails they will receive.',
      },
      {
        displayName: 'Visibility',
        name: 'visibility',
        type: 'options',
        default: 'private',
        options: [
          { name: 'Private', value: 'private' },
          { name: 'Public', value: 'public' },
        ],
        description:
          'Whether the topic is visible on the unsubscribe page. Public topics let contacts manage their own subscriptions.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('topicName', index) as string;
  const defaultSubscription = this.getNodeParameter(
    'topicDefaultSubscription',
    index,
  ) as string;
  const createOptions = this.getNodeParameter(
    'topicCreateOptions',
    index,
    {},
  ) as {
    description?: string;
    visibility?: string;
  };

  const body: IDataObject = {
    name,
    defaultSubscription,
  };

  if (createOptions.description) {
    body.description = createOptions.description;
  }
  if (createOptions.visibility) {
    body.visibility = createOptions.visibility;
  }

  const response = await apiRequest.call(this, 'POST', '/topics', body);

  return [{ json: response, pairedItem: { item: index } }];
}
