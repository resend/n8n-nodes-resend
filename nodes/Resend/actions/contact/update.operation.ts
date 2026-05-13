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
  {
    displayName: 'Update By',
    name: 'updateBy',
    type: 'options',
    options: [
      { name: 'Contact ID', value: 'id' },
      { name: 'Email Address', value: 'email' },
    ],
    default: 'id',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['update'],
      },
    },
    description:
      'Choose how to identify the contact: by their unique ID or their email address. Use ID for precise matching, email for convenience.',
  },
  createDynamicIdField({
    fieldName: 'contactId',
    resourceName: 'contact',
    displayName: 'Contact',
    required: true,
    placeholder: 'con_123456',
    description:
      'The unique identifier of the contact to update. Obtain from the List Contacts or Create Contact operation.',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['update'],
        updateBy: ['id'],
      },
    },
  }),
  {
    displayName: 'Contact Email',
    name: 'contactEmail',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'contact@example.com',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['update'],
        updateBy: ['email'],
      },
    },
    description:
      'The email address of the contact to update. Must be an existing contact in Resend.',
  },
  {
    displayName: 'Update Fields',
    name: 'contactUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'First Name',
        name: 'firstName',
        type: 'string',
        default: '',
        description:
          'The first name of the contact. Can be used in email personalization with {{{FIRST_NAME}}} variable.',
      },
      {
        displayName: 'Last Name',
        name: 'lastName',
        type: 'string',
        default: '',
        description:
          'The last name of the contact. Can be used in email personalization with {{{LAST_NAME}}} variable.',
      },
      {
        displayName: 'Unsubscribed',
        name: 'unsubscribed',
        type: 'boolean',
        default: false,
        description:
          'Whether the contact is unsubscribed from emails. Set to true to prevent future emails from being sent to this contact.',
      },
      {
        displayName: 'Properties',
        name: 'properties',
        type: 'fixedCollection',
        default: { properties: [] },
        typeOptions: {
          multipleValues: true,
        },
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
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
              },
            ],
          },
        ],
      },
    ],
  },
];

interface PropertyItem {
  key: string;
  value: string;
}

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const updateBy = this.getNodeParameter('updateBy', index) as string;
  const updateFields = this.getNodeParameter(
    'contactUpdateFields',
    index,
    {},
  ) as {
    firstName?: string;
    lastName?: string;
    unsubscribed?: boolean;
    properties?: { properties: PropertyItem[] };
  };

  let identifier: string;
  if (updateBy === 'id') {
    identifier = resolveDynamicIdValue(this, 'contactId', index);
  } else {
    identifier = this.getNodeParameter('contactEmail', index) as string;
  }

  const body: IDataObject = {};

  if (updateFields.firstName !== undefined) {
    body.first_name = updateFields.firstName;
  }
  if (updateFields.lastName !== undefined) {
    body.last_name = updateFields.lastName;
  }
  if (updateFields.unsubscribed !== undefined) {
    body.unsubscribed = updateFields.unsubscribed;
  }

  if (updateFields.properties?.properties?.length) {
    const props: Record<string, string> = {};
    for (const p of updateFields.properties.properties) {
      props[p.key] = p.value;
    }
    body.properties = props;
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/contacts/${encodeURIComponent(identifier)}`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
