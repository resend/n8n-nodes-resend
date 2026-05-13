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
      'The unique identifier of the contact property to retrieve. Obtain from the Create Contact Property response or List Contact Properties operation.',
    displayOptions: {
      show: {
        resource: ['contactProperties'],
        operation: ['get'],
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
    'GET',
    `/contact-properties/${encodeURIComponent(contactPropertyId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
