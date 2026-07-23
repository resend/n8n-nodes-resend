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
    fieldName: 'suppressionIdentifier',
    resourceName: 'suppression',
    displayName: 'Suppression',
    required: true,
    placeholder: 'e169aa45-1ecf-4183-9955-b1499d5701d3',
    description:
      'The suppression to retrieve. Select from the list, or enter a suppression ID or the suppressed email address directly.',
    displayOptions: {
      show: {
        resource: ['suppressions'],
        operation: ['get'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const suppression = resolveDynamicIdValue(
    this,
    'suppressionIdentifier',
    index,
  );

  const response = await apiRequest.call(
    this,
    'GET',
    `/suppressions/${encodeURIComponent(suppression)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
