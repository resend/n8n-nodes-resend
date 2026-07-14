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
    placeholder: 'd91cd9bd-1176-453e-8fc1-35364d380206',
    description:
      'The parent domain. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['deleteTrackingDomain'],
      },
    },
  }),
  {
    displayName: 'Tracking Domain ID',
    name: 'trackingDomainId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['deleteTrackingDomain'],
      },
    },
    description: 'The unique identifier of the tracking domain to delete',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const domainId = resolveDynamicIdValue(this, 'domainId', index);
  const trackingDomainId = this.getNodeParameter(
    'trackingDomainId',
    index,
  ) as string;

  const response = await apiRequest.call(
    this,
    'DELETE',
    `/domains/${encodeURIComponent(domainId)}/tracking-domains/${encodeURIComponent(trackingDomainId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
