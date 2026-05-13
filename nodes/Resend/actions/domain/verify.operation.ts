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
    fieldName: 'domainId',
    resourceName: 'domain',
    displayName: 'Domain',
    required: true,
    placeholder: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
    description:
      'The unique identifier of the domain to verify. Triggers a verification check for the domain. Make sure DNS records are configured correctly before verifying.',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['verify'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const domainId = resolveDynamicIdValue(this, 'domainId', index);

  const response = await apiRequest.call(
    this,
    'POST',
    `/domains/${encodeURIComponent(domainId)}/verify`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
