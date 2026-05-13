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
    fieldName: 'templateId',
    resourceName: 'template',
    displayName: 'Template',
    required: true,
    placeholder: 'template_123456',
    description: 'The template to retrieve',
    displayOptions: {
      show: {
        resource: ['templates'],
        operation: ['get'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const templateId = resolveDynamicIdValue(this, 'templateId', index);

  const response = await apiRequest.call(
    this,
    'GET',
    `/templates/${encodeURIComponent(templateId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
