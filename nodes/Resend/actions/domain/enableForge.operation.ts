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
      'The sending domain to put on Resend Forge. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['enableForge'],
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
        operation: ['enableForge'],
      },
    },
    options: [
      {
        displayName: 'Custom Return Path',
        name: 'custom_return_path',
        type: 'string',
        default: '',
        placeholder: 'forge',
        description:
          'The subdomain for the Forge Return-Path address (e.g., "forge" on example.com produces forge.example.com). It must start with a letter, end with a letter or digit, and be 63 characters or less. When omitted, Resend picks a free subdomain. It is set once and cannot be changed afterwards.',
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

  const body: IDataObject = {};

  if (additionalOptions.custom_return_path)
    body.custom_return_path = additionalOptions.custom_return_path;

  const response = await apiRequest.call(
    this,
    'POST',
    `/domains/${encodeURIComponent(domainId)}/forge`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
