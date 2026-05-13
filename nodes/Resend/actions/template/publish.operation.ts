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
    fieldName: 'templateIdPublish',
    resourceName: 'template',
    displayName: 'Template',
    required: true,
    placeholder: 'template_123456',
    description:
      'The template to publish. Publishing makes the template available for sending emails.',
    displayOptions: {
      show: {
        resource: ['templates'],
        operation: ['publish'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const templateId = resolveDynamicIdValue(this, 'templateIdPublish', index);

  const response = await apiRequest.call(
    this,
    'POST',
    `/templates/${encodeURIComponent(templateId)}/publish`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
