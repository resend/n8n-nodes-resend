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

const MAX_LABELS = 100;

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['setLabels']),
  threadIdField(['setLabels']),
  threadLabelIdsField(
    'setLabels',
    'Labels the thread carries after the change, replacing every current label. Up to 100 IDs. Leave empty to take every label off the thread.',
  ),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const labels = getThreadLabelIds(this, index);
  if (labels.length > MAX_LABELS) {
    throw new NodeOperationError(
      this.getNode(),
      `Set Labels takes at most ${MAX_LABELS} label IDs (got ${labels.length})`,
      { itemIndex: index },
    );
  }

  const response = await apiRequest.call(
    this,
    'PUT',
    getThreadLabelsPath(this, index),
    { labels },
  );

  return [{ json: response, pairedItem: { item: index } }];
}
