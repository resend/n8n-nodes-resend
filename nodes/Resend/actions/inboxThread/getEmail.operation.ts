import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  createInboxField,
  getThreadEmailPath,
  threadEmailIdField,
  threadIdField,
} from './shared';

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['getEmail']),
  threadIdField(['getEmail']),
  threadEmailIdField(['getEmail']),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await apiRequest.call(
    this,
    'GET',
    getThreadEmailPath(this, index),
  );

  return [{ json: response, pairedItem: { item: index } }];
}
