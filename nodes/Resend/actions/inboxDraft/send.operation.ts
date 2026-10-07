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
  createInboxField('inboxDrafts', ['send']),
  draftIdField(['send']),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await apiRequest.call(
    this,
    'POST',
    `${getDraftPath(this, index)}/send`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
