import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

const BETA_NOTICE =
  'Workflows are currently in private alpha and only available to a limited number of users. APIs might change before GA. <a href="https://resend.com/contact">Contact us</a> if you\'re interested in testing this feature.';

export const description: INodeProperties[] = [
  {
    displayName: BETA_NOTICE,
    name: 'workflowBetaNotice',
    type: 'notice',
    default: '',
    displayOptions: {
      show: {
        resource: ['workflows'],
        operation: ['listRuns'],
      },
    },
  },
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
        operation: ['listRuns'],
      },
    },
    description: 'The unique identifier of the workflow to list runs for',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const workflowId = this.getNodeParameter('workflowId', index) as string;

  const response = await apiRequest.call(
    this,
    'GET',
    `/workflows/${encodeURIComponent(workflowId)}/runs`,
  );

  const items = (response as any)?.data ?? [];
  const executionData = items.map((item: any) => ({
    json: item,
    pairedItem: { item: index },
  }));

  return executionData.length > 0
    ? executionData
    : [{ json: response, pairedItem: { item: index } }];
}
