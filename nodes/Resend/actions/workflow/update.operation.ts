import type {
  IDataObject,
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
        operation: ['update'],
      },
    },
    description: 'The unique identifier of the workflow to update',
  },
  {
    displayName: 'Status',
    name: 'workflowStatus',
    type: 'options',
    required: true,
    options: [
      { name: 'Enabled', value: 'enabled' },
      { name: 'Disabled', value: 'disabled' },
    ],
    default: 'enabled',
    displayOptions: {
      show: {
        resource: ['workflows'],
        operation: ['update'],
      },
    },
    description: 'The status of the workflow',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const workflowId = this.getNodeParameter('workflowId', index) as string;
  const status = this.getNodeParameter('workflowStatus', index) as string;

  const body: IDataObject = { status };

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/workflows/${encodeURIComponent(workflowId)}`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
