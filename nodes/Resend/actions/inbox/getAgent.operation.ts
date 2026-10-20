import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { inboxIdField, inboxPath } from './fields';

export const description: INodeProperties[] = [
  inboxIdField('getAgent', 'The inbox whose agent settings to retrieve'),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await apiRequest.call(
    this,
    'GET',
    inboxPath(this, index, '/agent'),
  );

  return [{ json: response, pairedItem: { item: index } }];
}
