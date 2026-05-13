import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';

export const description: INodeProperties[] = [
  createDynamicIdField({
    fieldName: 'templateIdDuplicate',
    resourceName: 'template',
    displayName: 'Template',
    required: true,
    placeholder: 'template_123456',
    description: 'The template to duplicate',
    displayOptions: {
      show: {
        resource: ['templates'],
        operation: ['duplicate'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const templateId = resolveDynamicIdValue(this, 'templateIdDuplicate', index);

  const response = await apiRequest.call(
    this,
    'POST',
    `/templates/${encodeURIComponent(templateId)}/duplicate`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
