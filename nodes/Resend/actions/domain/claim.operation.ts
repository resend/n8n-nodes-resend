import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Domain Name',
    name: 'domainName',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'example.com',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['claim'],
      },
    },
    description: 'The name of the domain you want to claim',
  },
  {
    displayName: 'Additional Options',
    name: 'additionalOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['claim'],
      },
    },
    options: [
      {
        displayName: 'Click Tracking',
        name: 'click_tracking',
        type: 'boolean',
        default: false,
        description:
          'Whether to track clicks within the body of each HTML email. Only applied if a tracking_subdomain is configured and verified.',
      },
      {
        displayName: 'Custom Return Path',
        name: 'custom_return_path',
        type: 'string',
        default: 'send',
        placeholder: 'send',
        description:
          'Choose a subdomain for the Return-Path address. Defaults to "send" (i.e., send.yourdomain.tld).',
      },
      {
        displayName: 'Open Tracking',
        name: 'open_tracking',
        type: 'boolean',
        default: false,
        description:
          'Whether to track the open rate of each email. Only applied if a tracking_subdomain is configured and verified.',
      },
      {
        displayName: 'Region',
        name: 'region',
        type: 'options',
        options: [
          { name: 'US East (N. Virginia)', value: 'us-east-1' },
          { name: 'EU West (Ireland)', value: 'eu-west-1' },
          { name: 'South America (São Paulo)', value: 'sa-east-1' },
          { name: 'Asia Pacific (Tokyo)', value: 'ap-northeast-1' },
        ],
        default: 'us-east-1',
        description: 'The region where emails will be sent from',
      },
      {
        displayName: 'Tracking Subdomain',
        name: 'tracking_subdomain',
        type: 'string',
        default: '',
        placeholder: 'links',
        description:
          'Configure a custom subdomain for click and open tracking (e.g., "links" on domain example.com produces links.example.com)',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const domainName = this.getNodeParameter('domainName', index) as string;
  const additionalOptions = this.getNodeParameter(
    'additionalOptions',
    index,
  ) as IDataObject;

  const body: IDataObject = { name: domainName };

  if (additionalOptions.region) body.region = additionalOptions.region;
  if (additionalOptions.custom_return_path)
    body.custom_return_path = additionalOptions.custom_return_path;
  if (additionalOptions.open_tracking !== undefined)
    body.open_tracking = additionalOptions.open_tracking;
  if (additionalOptions.click_tracking !== undefined)
    body.click_tracking = additionalOptions.click_tracking;
  if (additionalOptions.tracking_subdomain)
    body.tracking_subdomain = additionalOptions.tracking_subdomain;

  const response = await apiRequest.call(this, 'POST', '/domains/claim', body);

  return [{ json: response, pairedItem: { item: index } }];
}
