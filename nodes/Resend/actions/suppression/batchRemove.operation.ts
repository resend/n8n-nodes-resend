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
    displayName: 'Remove By',
    name: 'suppressionRemoveBy',
    type: 'options',
    default: 'emails',
    displayOptions: {
      show: {
        resource: ['suppressions'],
        operation: ['batchRemove'],
      },
    },
    options: [
      {
        name: 'Emails',
        value: 'emails',
        description: 'Remove suppressions matching these email addresses',
      },
      {
        name: 'IDs',
        value: 'ids',
        description: 'Remove suppressions matching these suppression IDs',
      },
    ],
    description:
      'Whether to remove suppressions by email address or by suppression ID. Provide one or the other, not both.',
  },
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
        operation: ['batchRemove'],
        suppressionRemoveBy: ['emails'],
      },
    },
    description:
      'Comma-separated list of email addresses to remove from the suppression list. Up to 100 addresses per request.',
  },
  {
    displayName: 'IDs',
    name: 'suppressionIds',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'e169aa45-1ecf-4183-9955-b1499d5701d3, ...',
    displayOptions: {
      show: {
        resource: ['suppressions'],
        operation: ['batchRemove'],
        suppressionRemoveBy: ['ids'],
      },
    },
    description:
      'Comma-separated list of suppression IDs to remove from the suppression list. Up to 100 IDs per request.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const removeBy = this.getNodeParameter(
    'suppressionRemoveBy',
    index,
    'emails',
  ) as 'emails' | 'ids';

  const field = removeBy === 'ids' ? 'suppressionIds' : 'suppressionEmails';
  const values = normalizeEmailList(
    this.getNodeParameter(field, index) as string,
  );

  if (values.length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      `Provide at least one ${removeBy === 'ids' ? 'suppression ID' : 'email address'} to remove`,
      { itemIndex: index },
    );
  }
  if (values.length > 100) {
    throw new NodeOperationError(
      this.getNode(),
      'A batch remove supports at most 100 entries per request',
      { itemIndex: index },
    );
  }

  const body: IDataObject = { [removeBy]: values };

  const response = await apiRequest.call(
    this,
    'POST',
    '/suppressions/batch/remove',
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
