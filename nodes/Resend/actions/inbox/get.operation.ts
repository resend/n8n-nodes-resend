import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { inboxIdField, inboxPath } from './fields';

export const description: INodeProperties[] = [
  inboxIdField(
    'get',
    'The inbox to retrieve, by ID or by email address (e.g. support@example.com)',
  ),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await apiRequest.call(this, 'GET', inboxPath(this, index));

  return [{ json: response, pairedItem: { item: index } }];
}
