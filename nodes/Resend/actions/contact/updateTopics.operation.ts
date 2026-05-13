import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';

export const description: INodeProperties[] = [
  createDynamicIdField({
    fieldName: 'contactIdUpdateTopics',
    resourceName: 'contact',
    displayName: 'Contact',
    required: true,
    placeholder: 'con_123456',
    description: 'The contact whose topic subscriptions to update.',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['updateTopics'],
      },
    },
  }),
  {
    displayName: 'Topics',
    name: 'topicsToUpdate',
    type: 'fixedCollection',
    required: true,
    default: { topics: [] },
    typeOptions: {
      multipleValues: true,
    },
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['updateTopics'],
      },
    },
    options: [
      {
        name: 'topics',
        displayName: 'Topic',
        values: [
          {
            displayName: 'Topic Name or ID',
            name: 'id',
            type: 'options',
            required: true,
            default: '',
            typeOptions: {
              loadOptionsMethod: 'getTopics',
            },
            description:
              'The topic to update subscription for. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
          },
          {
            displayName: 'Subscription',
            name: 'subscription',
            type: 'options',
            required: true,
            default: 'opt_in',
            options: [
              {
                name: 'Opt In',
                value: 'opt_in',
                description: 'Subscribe the contact to this topic',
              },
              {
                name: 'Opt Out',
                value: 'opt_out',
                description: 'Unsubscribe the contact from this topic',
              },
            ],
            description:
              'Whether the contact should be opted in or opted out of this topic. Opted-out contacts will not receive emails scoped to this topic.',
          },
        ],
      },
    ],
    description:
      'List of topics to update subscription status for. Each topic requires its ID and a subscription value (opt_in or opt_out).',
  },
];

interface TopicItem {
  id: string;
  subscription: string;
}

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const contactId = resolveDynamicIdValue(this, 'contactIdUpdateTopics', index);
  const topicsInput = this.getNodeParameter('topicsToUpdate', index, {
    topics: [],
  }) as {
    topics: TopicItem[];
  };

  const body: IDataObject = {
    topics: topicsInput.topics.map((t) => ({
      id: t.id,
      subscription: t.subscription,
    })),
  };

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/contacts/${encodeURIComponent(contactId)}/topics`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
