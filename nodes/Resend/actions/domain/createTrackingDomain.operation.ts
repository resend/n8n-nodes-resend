import type {
  IDataObject,
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
      'The domain to create a tracking subdomain for. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['createTrackingDomain'],
      },
    },
  }),
  {
    displayName: 'Subdomain',
    name: 'trackingSubdomain',
    type: 'string',
    required: true,
    default: 'links',
    placeholder: 'links',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['createTrackingDomain'],
      },
    },
    description:
      'The subdomain to use for click tracking (e.g., "links" results in links.example.com)',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const domainId = resolveDynamicIdValue(this, 'domainId', index);
  const subdomain = this.getNodeParameter('trackingSubdomain', index) as string;

  const body: IDataObject = { subdomain };

  const response = await apiRequest.call(
    this,
    'POST',
    `/domains/${encodeURIComponent(domainId)}/tracking-domains`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
