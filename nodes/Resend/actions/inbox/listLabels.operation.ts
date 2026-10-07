import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { inboxIdField, inboxPath } from './fields';

export const description: INodeProperties[] = [
  inboxIdField('listLabels', 'The inbox whose labels to list'),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await apiRequest.call(
    this,
    'GET',
    inboxPath(this, index, '/labels'),
  );

  const labels = Array.isArray(response.data)
    ? (response.data as IDataObject[])
    : [];

  return labels.map((label) => ({
    json: label,
    pairedItem: { item: index },
  }));
}
