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
    fieldName: 'contactIdGetTopics',
    resourceName: 'contact',
    displayName: 'Contact',
    required: true,
    placeholder: 'con_123456',
    description: 'The contact whose topic subscriptions to retrieve.',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['getTopics'],
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
        resource: ['contacts'],
        operation: ['getTopics'],
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
        resource: ['contacts'],
        operation: ['getTopics'],
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
  const contactId = resolveDynamicIdValue(this, 'contactIdGetTopics', index);
  const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
  const limit = this.getNodeParameter('limit', index, 50) as number;

  const qs: IDataObject = {};
  if (!returnAll) {
    qs.limit = limit;
  }

  const response = await apiRequest.call(
    this,
    'GET',
    `/contacts/${encodeURIComponent(contactId)}/topics`,
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
