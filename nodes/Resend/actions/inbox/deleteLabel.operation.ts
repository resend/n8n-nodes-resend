import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { inboxIdField, labelIdField, labelPath } from './fields';

export const description: INodeProperties[] = [
  inboxIdField('deleteLabel', 'The inbox the label belongs to'),
  labelIdField(
    'deleteLabel',
    'The label to delete. This action is permanent and cannot be undone.',
  ),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const response = await apiRequest.call(
    this,
    'DELETE',
    labelPath(this, index),
  );

  return [{ json: response, pairedItem: { item: index } }];
}
