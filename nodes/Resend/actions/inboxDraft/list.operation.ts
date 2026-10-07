import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { createListExecutionData, requestList } from '../../transport';
import {
  createInboxField,
  createListFields,
  getInboxPath,
} from '../inboxThread/shared';

export const description: INodeProperties[] = [
  createInboxField('inboxDrafts', ['list']),
  ...createListFields('inboxDrafts', 'list'),
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const items = await requestList.call(this, `${getInboxPath(this, 0)}/drafts`);
  return createListExecutionData.call(this, items);
}
