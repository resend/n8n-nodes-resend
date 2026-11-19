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
  {
    displayName: 'Additional Options',
    name: 'additionalOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['verify'],
      },
    },
    options: [
      {
        displayName: 'Scope',
        name: 'scope',
        type: 'multiOptions',
        options: [{ name: 'Forge', value: 'forge' }],
        default: [],
        description:
          'Limit the check to specific records. With Forge, only the Forge record is checked and the other records keep their current status. Requires Forge to be enabled on the domain. When empty, all records are checked.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const domainId = resolveDynamicIdValue(this, 'domainId', index);
  const additionalOptions = this.getNodeParameter(
    'additionalOptions',
    index,
    {},
  ) as IDataObject;
  const scope = additionalOptions.scope as string[] | undefined;

  const response = await apiRequest.call(
    this,
    'POST',
    `/domains/${encodeURIComponent(domainId)}/verify`,
    scope?.length ? { scope } : undefined,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
