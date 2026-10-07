import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { createInboxField, getThreadPath, threadIdField } from './shared';

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['get']),
  threadIdField(['get']),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await apiRequest.call(
    this,
    'GET',
    getThreadPath(this, index),
  );

  return [{ json: response, pairedItem: { item: index } }];
}
