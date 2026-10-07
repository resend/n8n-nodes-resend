import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { requestList } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Automation ID',
    name: 'automationId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'c9b16d4f-ba6c-4e2e-b044-6bf4404e57fd',
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['listRuns'],
      },
    },
    description: 'The unique identifier of the automation to list runs for',
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['listRuns'],
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
        operation: ['listRuns'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  {
    displayName: 'Status',
    name: 'automationRunStatus',
    type: 'multiOptions',
    default: [],
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['listRuns'],
      },
    },
    options: [
      { name: 'Cancelled', value: 'cancelled' },
      { name: 'Completed', value: 'completed' },
      { name: 'Failed', value: 'failed' },
      { name: 'Running', value: 'running' },
    ],
    description: 'Only return runs with one of these statuses',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const automationId = this.getNodeParameter('automationId', index) as string;
  const statuses = this.getNodeParameter(
    'automationRunStatus',
    index,
    [],
  ) as string[];

  const extraQs: IDataObject = {};
  if (statuses.length) {
    extraQs.status = statuses.join(',');
  }

  const items = await requestList.call(
    this,
    `/automations/${encodeURIComponent(automationId)}/runs`,
    extraQs,
  );

  return items.map((item) => ({
    json: item,
    pairedItem: { item: index },
  }));
}
