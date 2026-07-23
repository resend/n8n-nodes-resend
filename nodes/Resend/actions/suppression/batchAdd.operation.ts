import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, normalizeEmailList } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Emails',
    name: 'suppressionEmails',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'one@example.com, two@example.com',
    displayOptions: {
      show: {
        resource: ['suppressions'],
        operation: ['batchAdd'],
      },
    },
    description:
      'Comma-separated list of email addresses to add to the suppression list. Up to 100 addresses per request.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const emails = normalizeEmailList(
    this.getNodeParameter('suppressionEmails', index) as string,
  );

  if (emails.length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'Provide at least one email address to suppress',
      { itemIndex: index },
    );
  }
  if (emails.length > 100) {
    throw new NodeOperationError(
      this.getNode(),
      'A batch add supports at most 100 email addresses per request',
      { itemIndex: index },
    );
  }

  const body: IDataObject = { emails };

  const response = await apiRequest.call(
    this,
    'POST',
    '/suppressions/batch/add',
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
