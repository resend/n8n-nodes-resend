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
  const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
  const limit = this.getNodeParameter('limit', index, 50) as number;

  const qs: IDataObject = {};
  if (!returnAll) {
    qs.limit = limit;
  }

  const response = await apiRequest.call(
    this,
    'GET',
    `/emails/receiving/${encodeURIComponent(emailId)}/attachments`,
    undefined,
    qs,
  );

  const items = (response as { data?: IDataObject[] }).data ?? [];
  const inputData = this.getInputData();

  return items.map((item, i) => ({
    json: item,
    pairedItem: { item: i < inputData.length ? i : 0 },
  }));
}
