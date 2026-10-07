import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { createListExecutionData, requestList } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['list'],
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
        resource: ['automations'],
        operation: ['list'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  {
    displayName: 'Status',
    name: 'automationStatusFilter',
    type: 'options',
    default: '',
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['list'],
      },
    },
    options: [
      { name: 'Any', value: '' },
      { name: 'Disabled', value: 'disabled' },
      { name: 'Enabled', value: 'enabled' },
    ],
    description: 'Only return automations with this status',
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const status = this.getNodeParameter(
    'automationStatusFilter',
    0,
    '',
  ) as string;
  const extraQs: IDataObject = {};
  if (status) {
    extraQs.status = status;
  }

  const items = await requestList.call(this, '/automations', extraQs);

  return createListExecutionData.call(this, items);
}
