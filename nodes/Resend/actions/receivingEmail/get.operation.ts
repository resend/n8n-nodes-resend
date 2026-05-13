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
    fieldName: 'receivedEmailId',
    resourceName: 'receivedEmail',
    displayName: 'Email',
    required: true,
    placeholder: 'email_123456',
    description:
      'The received email to retrieve. Obtain from the List Receiving Emails operation or webhook payload. Returns full email details including sender, subject, body, and headers.',
    displayOptions: {
      show: {
        resource: ['receivingEmails'],
        operation: ['get'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const emailId = resolveDynamicIdValue(this, 'receivedEmailId', index);

  const response = await apiRequest.call(
    this,
    'GET',
    `/emails/receiving/${encodeURIComponent(emailId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
