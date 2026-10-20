import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { requestList } from '../../transport';
import {
  createInboxField,
  createListFields,
  getThreadPath,
  threadIdField,
} from './shared';

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['listEmails']),
  threadIdField(['listEmails']),
  ...createListFields('inboxThreads', 'listEmails'),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const items = await requestList.call(
    this,
    `${getThreadPath(this, index)}/emails`,
    undefined,
    index,
  );
  return items.map((item) => ({ json: item, pairedItem: { item: index } }));
}
