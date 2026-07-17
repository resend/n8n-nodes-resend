import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { SEND_AND_WAIT_OPERATION } from 'n8n-workflow';
import {
  configureWaitTillDate,
  createEmail,
  getSendAndWaitProperties,
  sendResendEmail,
} from '../../utils/sendAndWait';

export const description: INodeProperties[] = getSendAndWaitProperties(
  [
    {
      displayName: 'From',
      name: 'sendFrom',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'you@example.com',
      description:
        'Sender email address. To include a friendly name, use the format "Your Name &lt;sender@domain.com&gt;".',
    },
    {
      displayName: 'To',
      name: 'sendTo',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'user@example.com',
      description: 'Recipient email address (single recipient only)',
    },
  ],
  'email',
  [],
  {
    defaultApproveLabel: 'Approve',
    defaultDisapproveLabel: 'Decline',
  },
);

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const email = createEmail(this);

  // Send email via Resend
  await sendResendEmail(this, email);

  // Configure wait time and pause execution
  const waitTill = configureWaitTillDate(this);
  await this.putExecutionToWait(waitTill);

  return this.getInputData();
}

export { SEND_AND_WAIT_OPERATION };
