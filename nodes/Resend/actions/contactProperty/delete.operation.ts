import type {
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
      'The unique identifier of the contact property to delete. This action is permanent and will remove the property from all contacts.',
    displayOptions: {
      show: {
        resource: ['contactProperties'],
        operation: ['delete'],
      },
    },
  }),
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

  const response = await apiRequest.call(
    this,
    'DELETE',
    `/contact-properties/${encodeURIComponent(contactPropertyId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
