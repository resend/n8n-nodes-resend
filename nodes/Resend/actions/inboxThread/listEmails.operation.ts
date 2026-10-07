import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { createListExecutionData, requestList } from '../../transport';
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
): Promise<INodeExecutionData[]> {
  const items = await requestList.call(
    this,
    `${getThreadPath(this, 0)}/emails`,
  );
  return createListExecutionData.call(this, items);
}
