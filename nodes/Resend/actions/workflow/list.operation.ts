import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { createListExecutionData, requestList } from '../../transport';

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
        operation: ['list'],
      },
    },
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const items = await requestList.call(this, '/workflows');

  return createListExecutionData.call(this, items);
}
