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
        operation: ['getRunStep'],
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
        operation: ['getRunStep'],
      },
    },
    description: 'The unique identifier of the workflow',
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
        resource: ['workflows'],
        operation: ['getRunStep'],
      },
    },
    description: 'The unique identifier of the workflow run',
  },
  {
    displayName: 'Step ID',
    name: 'stepId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 's1a2b3c4-d5e6-7890-abcd-ef1234567890',
    displayOptions: {
      show: {
        resource: ['workflows'],
        operation: ['getRunStep'],
      },
    },
    description: 'The unique identifier of the workflow run step',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const workflowId = this.getNodeParameter('workflowId', index) as string;
  const runId = this.getNodeParameter('runId', index) as string;
  const stepId = this.getNodeParameter('stepId', index) as string;

  const response = await apiRequest.call(
    this,
    'GET',
    `/workflows/${encodeURIComponent(workflowId)}/runs/${encodeURIComponent(runId)}/steps/${encodeURIComponent(stepId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
