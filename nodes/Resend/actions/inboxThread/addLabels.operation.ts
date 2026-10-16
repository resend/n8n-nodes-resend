import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  createInboxField,
  getThreadLabelIds,
  getThreadLabelsPath,
  threadIdField,
  threadLabelIdsField,
} from './shared';

const MAX_LABELS = 10;

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['addLabels']),
  threadIdField(['addLabels']),
  threadLabelIdsField(
    'addLabels',
    'Labels to apply to the thread. Between 1 and 10 IDs. Labels already on the thread stay on it.',
  ),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const labels = getThreadLabelIds(this, index);
  if (labels.length < 1 || labels.length > MAX_LABELS) {
    throw new NodeOperationError(
      this.getNode(),
      `Add Labels takes between 1 and ${MAX_LABELS} label IDs (got ${labels.length})`,
      { itemIndex: index },
    );
  }

  const response = await apiRequest.call(
    this,
    'POST',
    getThreadLabelsPath(this, index),
    { labels },
  );

  return [{ json: response, pairedItem: { item: index } }];
}
