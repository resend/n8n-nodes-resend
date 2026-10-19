import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { requestList } from '../../transport';
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
      'The received email whose attachments to list. Obtain from the List Receiving Emails or Get Receiving Email operation.',
    displayOptions: {
      show: {
        resource: ['receivingEmails'],
        operation: ['listAttachments'],
      },
    },
  }),
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['receivingEmails'],
        operation: ['listAttachments'],
      },
    },
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    typeOptions: {
      minValue: 1,
    },
    displayOptions: {
      show: {
        resource: ['receivingEmails'],
        operation: ['listAttachments'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const emailId = resolveDynamicIdValue(this, 'receivedEmailId', index);

  const items = await requestList.call(
    this,
    `/emails/receiving/${encodeURIComponent(emailId)}/attachments`,
    undefined,
    index,
  );

  return items.map((item) => ({
    json: item,
    pairedItem: { item: index },
  }));
}
