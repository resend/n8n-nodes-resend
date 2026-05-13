import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Email',
    name: 'email',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'contact@example.com',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['create'],
      },
    },
    description:
      'The email address for the new contact. This will be used for sending emails and must be unique within the audience.',
  },
  {
    displayName: 'Create Fields',
    name: 'contactCreateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'First Name',
        name: 'firstName',
        type: 'string',
        default: '',
        description:
          "The contact's first name. Used for personalization in email templates.",
      },
      {
        displayName: 'Last Name',
        name: 'lastName',
        type: 'string',
        default: '',
        description:
          "The contact's last name. Used for personalization in email templates.",
      },
      {
        displayName: 'Properties',
        name: 'properties',
        type: 'fixedCollection',
        default: { properties: [] },
        typeOptions: {
          multipleValues: true,
        },
        description:
          'Custom key-value properties to store additional contact information like company, role, or any custom data',
        options: [
          {
            name: 'properties',
            displayName: 'Property',
            values: [
              {
                displayName: 'Key',
                name: 'key',
                type: 'string',
                required: true,
                default: '',
                description:
                  'The property name. Example: "company", "role", "plan".',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
                description:
                  'The property value. Example: "Acme Inc", "Developer", "Pro".',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Segments',
        name: 'segments',
        type: 'fixedCollection',
        default: { segments: [] },
        typeOptions: {
          multipleValues: true,
        },
        description: 'Assign the contact to one or more segments on creation',
        options: [
          {
            name: 'segments',
            displayName: 'Segment',
            values: [
              {
                displayName: 'Segment Name or ID',
                name: 'id',
                type: 'options',
                required: true,
                default: '',
                typeOptions: {
                  loadOptionsMethod: 'getSegments',
                },
                description:
                  'The segment to add this contact to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Topics',
        name: 'topics',
        type: 'fixedCollection',
        default: { topics: [] },
        typeOptions: {
          multipleValues: true,
        },
        description:
          'Set topic subscription preferences for the contact on creation',
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
                  'The subscription topic. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
              },
              {
                displayName: 'Subscription',
                name: 'subscription',
                type: 'options',
                default: 'opt_in',
                description:
                  'Whether the contact is subscribed (opt_in) or unsubscribed (opt_out) from this topic',
                options: [
                  {
                    name: 'Opt In',
                    value: 'opt_in',
                    description:
                      'Contact wants to receive emails on this topic',
                  },
                  {
                    name: 'Opt Out',
                    value: 'opt_out',
                    description: 'Contact does not want emails on this topic',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        displayName: 'Unsubscribed',
        name: 'unsubscribed',
        type: 'boolean',
        default: false,
        description:
          'Whether the contact is globally unsubscribed from all emails. Set to true to prevent all email delivery to this contact.',
      },
    ],
  },
];

interface PropertyItem {
  key: string;
  value: string;
}

interface SegmentItem {
  id: string;
}

interface TopicItem {
  id: string;
  subscription: string;
}

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const email = this.getNodeParameter('email', index) as string;
  const createFields = this.getNodeParameter(
    'contactCreateFields',
    index,
    {},
  ) as {
    firstName?: string;
    lastName?: string;
    unsubscribed?: boolean;
    properties?: { properties: PropertyItem[] };
    segments?: { segments: SegmentItem[] };
    topics?: { topics: TopicItem[] };
  };

  const body: IDataObject = { email };

  if (createFields.firstName) {
    body.first_name = createFields.firstName;
  }
  if (createFields.lastName) {
    body.last_name = createFields.lastName;
  }
  if (createFields.unsubscribed !== undefined) {
    body.unsubscribed = createFields.unsubscribed;
  }

  if (createFields.properties?.properties?.length) {
    const props: Record<string, string> = {};
    for (const p of createFields.properties.properties) {
      props[p.key] = p.value;
    }
    body.properties = props;
  }

  if (createFields.segments?.segments?.length) {
    body.segments = createFields.segments.segments.map((s) => ({ id: s.id }));
  }

  if (createFields.topics?.topics?.length) {
    body.topics = createFields.topics.topics.map((t) => ({
      id: t.id,
      subscription: t.subscription,
    }));
  }

  const response = await apiRequest.call(this, 'POST', '/contacts', body);

  return [{ json: response, pairedItem: { item: index } }];
}
