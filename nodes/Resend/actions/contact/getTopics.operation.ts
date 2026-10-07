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

  const items = await requestList.call(
    this,
    `/contacts/${encodeURIComponent(contactId)}/topics`,
    undefined,
    index,
  );

  return items.map((item) => ({
    json: item,
    pairedItem: { item: index },
  }));
}
