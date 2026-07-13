import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Workflow ID',
    name: 'workflowId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'c9b16d4f-ba6c-4e2e-b044-6bf4404e57fd',
    displayOptions: {
      show: {
        resource: ['workflows'],
        operation: ['delete'],
      },
    },
    description: 'The unique identifier of the workflow to delete',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const workflowId = this.getNodeParameter('workflowId', index) as string;

  const response = await apiRequest.call(
    this,
    'DELETE',
    `/workflows/${encodeURIComponent(workflowId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
