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
  createInboxField('inboxDrafts', ['get']),
  draftIdField(['get']),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await apiRequest.call(
    this,
    'GET',
    getDraftPath(this, index),
  );

  return [{ json: response, pairedItem: { item: index } }];
}
