import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  createInboxField,
  draftIdField,
  getDraftPath,
} from '../inboxThread/shared';

export const description: INodeProperties[] = [
  createInboxField('inboxDrafts', ['delete']),
  draftIdField(['delete']),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await apiRequest.call(
    this,
    'DELETE',
    getDraftPath(this, index),
  );

  return [{ json: response, pairedItem: { item: index } }];
}
