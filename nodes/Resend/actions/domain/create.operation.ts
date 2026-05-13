import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName:
      'After adding a domain, you must configure DNS records (SPF, DKIM, DMARC) and verify the domain before sending emails.',
    name: 'domainNotice',
    type: 'notice',
    default: '',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['create'],
      },
    },
  },
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
        operation: ['create'],
      },
    },
    description:
      'The domain name to add to Resend (e.g., example.com). After adding, you must configure DNS records to verify ownership before sending emails.',
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
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Capabilities',
        name: 'capabilities',
        type: 'fixedCollection',
        default: {},
        description:
          'Configure the domain capabilities for sending and receiving emails. At least one capability must be enabled.',
        options: [
          {
            displayName: 'Capabilities',
            name: 'capabilitiesValues',
            values: [
              {
                displayName: 'Sending',
                name: 'sending',
                type: 'options',
                options: [
                  { name: 'Enabled', value: 'enabled' },
                  { name: 'Disabled', value: 'disabled' },
                ],
                default: 'enabled',
                description: 'Whether this domain can be used to send emails',
              },
              {
                displayName: 'Receiving',
                name: 'receiving',
                type: 'options',
                options: [
                  { name: 'Enabled', value: 'enabled' },
                  { name: 'Disabled', value: 'disabled' },
                ],
                default: 'disabled',
                description: 'Whether this domain can receive inbound emails',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Click Tracking',
        name: 'clickTracking',
        type: 'boolean',
        default: false,
        description:
          'Whether to track clicks within the body of each HTML email sent from this domain',
      },
      {
        displayName: 'Custom Return Path',
        name: 'customReturnPath',
        type: 'string',
        default: 'send',
        description:
          'Custom subdomain for email bounce handling (Return-Path address). Defaults to "send". This subdomain needs to be configured in your DNS.',
      },
      {
        displayName: 'Open Tracking',
        name: 'openTracking',
        type: 'boolean',
        default: false,
        description:
          'Whether to track the open rate of each email sent from this domain',
      },
      {
        displayName: 'Region',
        name: 'region',
        type: 'options',
        options: [
          { name: 'US East 1', value: 'us-east-1' },
          { name: 'EU West 1', value: 'eu-west-1' },
          { name: 'South America East 1', value: 'sa-east-1' },
          { name: 'Asia Pacific Northeast 1', value: 'ap-northeast-1' },
        ],
        default: 'us-east-1',
        description:
          'The AWS region where emails will be sent from. Choose a region closest to your recipients for better deliverability.',
      },
      {
        displayName: 'TLS',
        name: 'tls',
        type: 'options',
        options: [
          { name: 'Opportunistic', value: 'opportunistic' },
          { name: 'Enforced', value: 'enforced' },
        ],
        default: 'opportunistic',
        description:
          'TLS setting for email delivery. Opportunistic attempts secure connection but falls back to unencrypted. Enforced requires TLS.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('domainName', index) as string;
  const additionalOptions = this.getNodeParameter(
    'additionalOptions',
    index,
    {},
  ) as {
    region?: string;
    customReturnPath?: string;
    openTracking?: boolean;
    clickTracking?: boolean;
    tls?: string;
    capabilities?: {
      capabilitiesValues?: {
        sending?: string;
        receiving?: string;
      };
    };
  };

  const body: IDataObject = { name };

  if (additionalOptions.region) {
    body.region = additionalOptions.region;
  }
  if (additionalOptions.customReturnPath) {
    body.custom_return_path = additionalOptions.customReturnPath;
  }
  if (additionalOptions.openTracking !== undefined) {
    body.open_tracking = additionalOptions.openTracking;
  }
  if (additionalOptions.clickTracking !== undefined) {
    body.click_tracking = additionalOptions.clickTracking;
  }
  if (additionalOptions.tls) {
    body.tls = additionalOptions.tls;
  }
  if (additionalOptions.capabilities?.capabilitiesValues) {
    const caps = additionalOptions.capabilities.capabilitiesValues;
    body.capabilities = {
      sending: caps.sending ?? 'enabled',
      receiving: caps.receiving ?? 'disabled',
    };
  }

  const response = await apiRequest.call(this, 'POST', '/domains', body);

  return [{ json: response, pairedItem: { item: index } }];
}
