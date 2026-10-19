import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { requestList } from '../../transport';
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
  index: number,
): Promise<INodeExecutionData[]> {
  const items = await requestList.call(
    this,
    `${getInboxPath(this, index)}/drafts`,
    undefined,
    index,
  );
  return items.map((item) => ({ json: item, pairedItem: { item: index } }));
}
