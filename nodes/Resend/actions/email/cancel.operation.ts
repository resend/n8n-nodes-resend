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
      'The scheduled email to cancel. Only works for emails that have been scheduled for future delivery and have not yet been sent.',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['cancel'],
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
    'POST',
    `/emails/${encodeURIComponent(emailId)}/cancel`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
