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
  {
    displayName:
      'Custom tracking domains are currently in private alpha and only available to a limited number of users. APIs might change before GA. <a href="https://resend.com/contact">Contact us</a> if you\'re interested in testing this feature.',
    name: 'trackingDomainAlphaNotice',
    type: 'notice',
    default: '',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['listTrackingDomains'],
      },
    },
  },
  createDynamicIdField({
    fieldName: 'domainId',
    resourceName: 'domain',
    displayName: 'Domain',
    required: true,
    placeholder: 'd91cd9bd-1176-453e-8fc1-35364d380206',
    description:
      'The parent domain to list tracking domains for. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['listTrackingDomains'],
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
    'GET',
    `/domains/${encodeURIComponent(domainId)}/tracking-domains`,
  );

  const items = (response as any)?.data ?? [];
  const executionData = items.map((item: any, _i: number) => ({
    json: item,
    pairedItem: { item: index },
  }));

  return executionData.length > 0
    ? executionData
    : [{ json: response, pairedItem: { item: index } }];
}
