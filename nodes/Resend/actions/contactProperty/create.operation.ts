import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Key',
    name: 'contactPropertyKey',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'company_name',
    displayOptions: {
      show: {
        resource: ['contactProperties'],
        operation: ['create'],
      },
    },
    description:
      'Unique identifier for the property using lowercase letters, numbers, and underscores (e.g., company_name, signup_date). Used to reference the property when creating/updating contacts.',
  },
  {
    displayName: 'Type',
    name: 'contactPropertyType',
    type: 'options',
    required: true,
    default: 'string',
    displayOptions: {
      show: {
        resource: ['contactProperties'],
        operation: ['create'],
      },
    },
    options: [
      { name: 'String', value: 'string' },
      { name: 'Number', value: 'number' },
    ],
    description:
      'The data type for this property. Use String for text values, Number for numeric values like quantities or prices.',
  },
  {
    displayName: 'Fallback Value',
    name: 'contactPropertyFallbackValue',
    type: 'string',
    default: '',
    placeholder: 'Acme Corp',
    displayOptions: {
      show: {
        resource: ['contactProperties'],
        operation: ['create'],
      },
    },
    description:
      'Default value used in email templates when the property is not set for a contact. Ensures templates render correctly even with missing data.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const key = this.getNodeParameter('contactPropertyKey', index) as string;
  const type = this.getNodeParameter('contactPropertyType', index) as string;
  const fallbackValue = this.getNodeParameter(
    'contactPropertyFallbackValue',
    index,
    '',
  ) as string;

  const body: IDataObject = { key, type };

  if (fallbackValue) {
    body.fallback_value = fallbackValue;
  }

  const response = await apiRequest.call(
    this,
    'POST',
    '/contact-properties',
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
