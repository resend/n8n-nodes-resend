import type {
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
        operation: ['getRun'],
      },
    },
    description: 'The unique identifier of the automation',
  },
  {
    displayName: 'Run ID',
    name: 'runId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['getRun'],
      },
    },
    description: 'The unique identifier of the automation run',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const automationId = this.getNodeParameter('automationId', index) as string;
  const runId = this.getNodeParameter('runId', index) as string;

  const response = await apiRequest.call(
    this,
    'GET',
    `/automations/${encodeURIComponent(automationId)}/runs/${encodeURIComponent(runId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
