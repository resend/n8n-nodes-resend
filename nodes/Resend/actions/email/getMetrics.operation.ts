import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

const metricOptions = [
  { name: 'Bounce Rate', value: 'bounce_rate' },
  { name: 'Bounced', value: 'bounced' },
  { name: 'Bounced Permanent', value: 'bounced_permanent' },
  { name: 'Bounced Transient', value: 'bounced_transient' },
  { name: 'Bounced Undetermined', value: 'bounced_undetermined' },
  { name: 'Click Rate', value: 'click_rate' },
  { name: 'Clicked', value: 'clicked' },
  { name: 'Complained', value: 'complained' },
  { name: 'Complaint Rate', value: 'complaint_rate' },
  { name: 'Delivered', value: 'delivered' },
  { name: 'Delivery Delayed', value: 'delivery_delayed' },
  { name: 'Delivery Rate', value: 'delivery_rate' },
  { name: 'Failed', value: 'failed' },
  { name: 'Open Rate', value: 'open_rate' },
  { name: 'Opened', value: 'opened' },
  { name: 'Received', value: 'received' },
  { name: 'Sent', value: 'sent' },
  { name: 'Suppressed', value: 'suppressed' },
  { name: 'Unique Clicked', value: 'unique_clicked' },
  { name: 'Unique Opened', value: 'unique_opened' },
  { name: 'Unsubscribe Rate', value: 'unsubscribe_rate' },
  { name: 'Unsubscribed', value: 'unsubscribed' },
];

const dimensionOptions = [
  {
    name: 'Broadcast',
    value: 'broadcast',
    description:
      'Break the results down per broadcast. Cannot be combined with the email dimension.',
  },
  {
    name: 'Domain',
    value: 'domain',
    description: 'Break the results down per sending domain',
  },
  {
    name: 'Email',
    value: 'email',
    description:
      'Break the results down per email. Cannot be combined with the broadcast dimension.',
  },
  {
    name: 'Period',
    value: 'period',
    description:
      'Break the results down per time bucket, sized by the granularity',
  },
];

export const description: INodeProperties[] = [
  {
    displayName: 'Options',
    name: 'metricsOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['getMetrics'],
      },
    },
    options: [
      {
        displayName: 'Broadcast IDs',
        name: 'broadcastIds',
        type: 'string',
        default: '',
        placeholder: '559ac32e-9ef5-46fb-82a1-b76b840c0f7b',
        description:
          'Comma-separated list of up to 100 broadcast IDs to report on. Cannot be combined with Email IDs or the email dimension.',
      },
      {
        displayName: 'Dimensions',
        name: 'dimensions',
        type: 'multiOptions',
        default: [],
        options: dimensionOptions,
        description:
          'How to break the results down. Leave empty to return a single totals row without a data breakdown.',
      },
      {
        displayName: 'Domain IDs',
        name: 'domainIds',
        type: 'string',
        default: '',
        placeholder: 'd91cd9bd-1176-453e-8fc1-35364d380206',
        description:
          'Comma-separated list of up to 100 sending domain IDs to report on',
      },
      {
        displayName: 'Email IDs',
        name: 'emailIds',
        type: 'string',
        default: '',
        placeholder: 'ae2014de-c168-4c61-8267-70d2662a1ce1',
        description:
          'Comma-separated list of up to 100 email IDs to report on. Cannot be combined with Broadcast IDs or the broadcast dimension.',
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        default: '',
        description:
          'End of the reporting range. Defaults to now. Values in the future are clamped to the current time.',
      },
      {
        displayName: 'Granularity',
        name: 'granularity',
        type: 'options',
        default: 'daily',
        options: [
          { name: 'Daily', value: 'daily' },
          { name: 'Hourly', value: 'hourly' },
          { name: 'Monthly', value: 'monthly' },
          { name: 'Weekly', value: 'weekly' },
        ],
        description:
          'Size of each time bucket when the period dimension is selected. The range cannot produce more than 10,000 periods.',
      },
      {
        displayName: 'Metrics',
        name: 'metrics',
        type: 'multiOptions',
        default: [],
        options: metricOptions,
        description:
          'Which metrics to return. Leave empty to return all of them.',
      },
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'dateTime',
        default: '',
        description:
          'Start of the reporting range. Defaults to six days before the end date. Must be on or before the end date.',
      },
      {
        displayName: 'Timezone',
        name: 'timezone',
        type: 'string',
        default: 'UTC',
        placeholder: 'America/New_York',
        description:
          'IANA timezone used to bucket periods when the period dimension is selected',
      },
    ],
  },
];

interface MetricsOptions {
  broadcastIds?: string;
  dimensions?: string[];
  domainIds?: string;
  emailIds?: string;
  endDate?: string;
  granularity?: string;
  metrics?: string[];
  startDate?: string;
  timezone?: string;
}

function normalizeIdList(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const ids = value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id);
  return ids.length ? ids.join(',') : undefined;
}

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const options = this.getNodeParameter(
    'metricsOptions',
    index,
    {},
  ) as MetricsOptions;

  const dimensions = options.dimensions ?? [];
  const hasEmailDimension = dimensions.includes('email');
  const hasBroadcastDimension = dimensions.includes('broadcast');
  const domainIds = normalizeIdList(options.domainIds);
  const emailIds = normalizeIdList(options.emailIds);
  const broadcastIds = normalizeIdList(options.broadcastIds);

  if (hasEmailDimension && hasBroadcastDimension) {
    throw new NodeOperationError(
      this.getNode(),
      'The "Email" and "Broadcast" dimensions cannot be combined. Resend rejects a metrics request that breaks the results down by both, so select only one of them.',
      { itemIndex: index },
    );
  }
  if (emailIds && broadcastIds) {
    throw new NodeOperationError(
      this.getNode(),
      'The "Email IDs" and "Broadcast IDs" filters cannot be combined. Resend rejects a metrics request that filters on both, so keep only one of them.',
      { itemIndex: index },
    );
  }
  if (emailIds && hasBroadcastDimension) {
    throw new NodeOperationError(
      this.getNode(),
      'The "Email IDs" filter cannot be combined with the "Broadcast" dimension. Resend rejects that combination, so remove one of them.',
      { itemIndex: index },
    );
  }
  if (broadcastIds && hasEmailDimension) {
    throw new NodeOperationError(
      this.getNode(),
      'The "Broadcast IDs" filter cannot be combined with the "Email" dimension. Resend rejects that combination, so remove one of them.',
      { itemIndex: index },
    );
  }

  const qs: IDataObject = {};

  if (options.startDate) {
    qs.start_date = options.startDate;
  }
  if (options.endDate) {
    qs.end_date = options.endDate;
  }
  if (options.timezone) {
    qs.timezone = options.timezone;
  }
  if (options.granularity) {
    qs.granularity = options.granularity;
  }
  if (options.metrics?.length) {
    qs.metrics = options.metrics.join(',');
  }
  if (dimensions.length) {
    qs.dimensions = dimensions.join(',');
  }
  if (domainIds) {
    qs.domain_id = domainIds;
  }
  if (emailIds) {
    qs.email_id = emailIds;
  }
  if (broadcastIds) {
    qs.broadcast_id = broadcastIds;
  }

  const response = await apiRequest.call(
    this,
    'GET',
    '/emails/metrics',
    undefined,
    qs,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
