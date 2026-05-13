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
    fieldName: 'emailId',
    resourceName: 'email',
    displayName: 'Email',
    required: true,
    placeholder: 'ae2014de-c168-4c61-8267-70d2662a1ce1',
    description:
      'The email to retrieve details for. Obtain from the Send Email response or List Emails operation. Returns email metadata including delivery status, timestamps, and recipient information.',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['retrieve'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const emailId = resolveDynamicIdValue(this, 'emailId', index);

  const response = await apiRequest.call(
    this,
    'GET',
    `/emails/${encodeURIComponent(emailId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
