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
    fieldName: 'emailId',
    resourceName: 'email',
    displayName: 'Email',
    required: true,
    placeholder: 'ae2014de-c168-4c61-8267-70d2662a1ce1',
    description:
      'The sent email whose attachments to list. Obtain from the Send Email response or List Emails operation.',
    displayOptions: {
      show: {
        resource: ['email'],
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
        resource: ['email'],
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
        resource: ['email'],
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
  const emailId = resolveDynamicIdValue(this, 'emailId', index);
  const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
  const limit = this.getNodeParameter('limit', index, 50) as number;

  const qs: IDataObject = {};
  if (!returnAll) {
    qs.limit = limit;
  }

  const response = await apiRequest.call(
    this,
    'GET',
    `/emails/${encodeURIComponent(emailId)}/attachments`,
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
