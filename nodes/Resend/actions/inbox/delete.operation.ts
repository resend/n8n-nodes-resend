import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { inboxIdField, inboxPath } from './fields';

export const description: INodeProperties[] = [
  inboxIdField(
    'delete',
    'The inbox to delete. This action is permanent and cannot be undone.',
  ),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await apiRequest.call(
    this,
    'DELETE',
    inboxPath(this, index),
  );

  return [{ json: response, pairedItem: { item: index } }];
}
