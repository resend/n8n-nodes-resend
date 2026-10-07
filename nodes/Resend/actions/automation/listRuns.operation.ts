import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

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
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const automationId = this.getNodeParameter('automationId', index) as string;

  const response = await apiRequest.call(
    this,
    'GET',
    `/automations/${encodeURIComponent(automationId)}/runs`,
  );

  const items = (response.data as IDataObject[] | undefined) ?? [];
  const executionData = items.map((item) => ({
    json: item,
    pairedItem: { item: index },
  }));

  return executionData.length > 0
    ? executionData
    : [{ json: response, pairedItem: { item: index } }];
}
