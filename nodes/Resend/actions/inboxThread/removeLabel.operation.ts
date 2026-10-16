import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  createInboxField,
  getRequiredString,
  getThreadLabelsPath,
  threadIdField,
} from './shared';

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['removeLabel']),
  threadIdField(['removeLabel']),
  {
    displayName: 'Label Name or ID',
    name: 'inboxThreadLabelId',
    type: 'options',
    required: true,
    default: '',
    typeOptions: {
      loadOptionsMethod: 'getInboxLabels',
      loadOptionsDependsOn: ['inboxId.value'],
    },
    description:
      'Label to take off the thread. The label itself is kept. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['inboxThreads'],
        operation: ['removeLabel'],
      },
    },
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const labelId = getRequiredString(this, 'inboxThreadLabelId', 'Label', index);

  const response = await apiRequest.call(
    this,
    'DELETE',
    `${getThreadLabelsPath(this, index)}/${encodeURIComponent(labelId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
