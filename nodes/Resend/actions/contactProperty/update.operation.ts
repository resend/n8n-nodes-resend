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
    fieldName: 'contactPropertyId',
    resourceName: 'contactProperty',
    displayName: 'Contact Property',
    required: true,
    placeholder: 'b6d24b8e-af0b-4c3c-be0c-359bbd97381e',
    description:
      'The unique identifier of the contact property to update. Obtain from the List Contact Properties operation.',
    displayOptions: {
      show: {
        resource: ['contactProperties'],
        operation: ['update'],
      },
    },
  }),
  {
    displayName: 'Update Fields',
    name: 'contactPropertyUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['contactProperties'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Fallback Value',
        name: 'fallbackValue',
        type: 'string',
        default: '',
        placeholder: 'Acme Corp',
        description:
          'New default value used in email templates when the property is not set on a contact',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const contactPropertyId = resolveDynamicIdValue(
    this,
    'contactPropertyId',
    index,
  );
  const updateFields = this.getNodeParameter(
    'contactPropertyUpdateFields',
    index,
    {},
  ) as {
    fallbackValue?: string;
  };

  const body: IDataObject = {};
  if (updateFields.fallbackValue !== undefined)
    body.fallback_value = updateFields.fallbackValue;

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/contact-properties/${encodeURIComponent(contactPropertyId)}`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
