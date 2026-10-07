import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
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
      'The unique identifier of the domain to update. Obtain from the Create Domain response or List Domains operation.',
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['update'],
      },
    },
  }),
  {
    displayName: 'Domain Update Options',
    name: 'domainUpdateOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['domains'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Click Tracking',
        name: 'clickTracking',
        type: 'boolean',
        default: false,
        description:
          'Whether to track clicks within the body of each HTML email. Only applied once a tracking subdomain is configured and verified.',
      },
      {
        displayName: 'Open Tracking',
        name: 'openTracking',
        type: 'boolean',
        default: false,
        description:
          'Whether to track the open rate of each email. Only applied once a tracking subdomain is configured and verified.',
      },
      {
        displayName: 'Receiving',
        name: 'receiving',
        type: 'options',
        options: [
          { name: 'Disabled', value: 'disabled' },
          { name: 'Enabled', value: 'enabled' },
        ],
        default: 'enabled',
        description:
          'Whether this domain can receive inbound emails. At least one capability must remain enabled.',
      },
      {
        displayName: 'Sending',
        name: 'sending',
        type: 'options',
        options: [
          { name: 'Disabled', value: 'disabled' },
          { name: 'Enabled', value: 'enabled' },
        ],
        default: 'enabled',
        description:
          'Whether this domain can be used to send emails. At least one capability must remain enabled.',
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
          'TLS setting for email delivery. Opportunistic attempts secure connection but falls back to unencrypted if needed. Enforced requires TLS and will not send if unavailable.',
      },
      {
        displayName: 'Tracking Subdomain',
        name: 'trackingSubdomain',
        type: 'string',
        default: '',
        placeholder: 'links',
        description:
          'Custom subdomain for click and open tracking (e.g., "links" on example.com produces links.example.com). Once set it can be changed but not removed. The new DNS record must be verified before it takes effect.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const domainId = resolveDynamicIdValue(this, 'domainId', index);
  const updateOptions = this.getNodeParameter(
    'domainUpdateOptions',
    index,
    {},
  ) as {
    clickTracking?: boolean;
    openTracking?: boolean;
    receiving?: string;
    sending?: string;
    tls?: string;
    trackingSubdomain?: string;
  };

  const body: IDataObject = {};

  if (updateOptions.clickTracking !== undefined) {
    body.click_tracking = updateOptions.clickTracking;
  }
  if (updateOptions.openTracking !== undefined) {
    body.open_tracking = updateOptions.openTracking;
  }
  if (updateOptions.tls) {
    body.tls = updateOptions.tls;
  }
  if (updateOptions.trackingSubdomain) {
    body.tracking_subdomain = updateOptions.trackingSubdomain;
  }
  if (
    updateOptions.sending === 'disabled' &&
    updateOptions.receiving === 'disabled'
  ) {
    throw new NodeOperationError(
      this.getNode(),
      'Sending and Receiving cannot both be disabled. At least one capability must remain enabled.',
      { itemIndex: index },
    );
  }
  if (updateOptions.sending || updateOptions.receiving) {
    const capabilities: IDataObject = {};
    if (updateOptions.sending) capabilities.sending = updateOptions.sending;
    if (updateOptions.receiving) {
      capabilities.receiving = updateOptions.receiving;
    }
    body.capabilities = capabilities;
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/domains/${encodeURIComponent(domainId)}`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
