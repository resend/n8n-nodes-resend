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
    fieldName: 'contactIdentifier',
    resourceName: 'contact',
    displayName: 'Contact',
    required: true,
    placeholder: 'e169aa45-1ecf-4183-9955-b1499d5701d3 or contact@example.com',
    description:
      'The contact to delete, specified by either UUID (e.g., e169aa45-1ecf-4183-9955-b1499d5701d3) or email address (e.g., contact@example.com). This action is permanent and cannot be undone.',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['delete'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const contactIdentifier = resolveDynamicIdValue(
    this,
    'contactIdentifier',
    index,
  );

  const response = await apiRequest.call(
    this,
    'DELETE',
    `/contacts/${encodeURIComponent(contactIdentifier)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
