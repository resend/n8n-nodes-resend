import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Options',
    name: 'broadcastMetricsOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['getMetrics'],
      },
    },
    options: [
      {
        displayName: 'Broadcast IDs',
        name: 'broadcastIds',
        type: 'string',
        default: '',
        placeholder: 'bc_123456,bc_789012',
        description:
          'Comma-separated list of broadcast IDs to restrict the response to, up to 100. Leave empty to include every broadcast.',
      },
      {
        displayName: 'Dimensions',
        name: 'dimensions',
        type: 'multiOptions',
        default: [],
        options: [
          {
            name: 'Broadcast',
            value: 'broadcast',
            description:
              'One row per broadcast, including its name resolved from your account',
          },
          {
            name: 'Period',
            value: 'period',
            description:
              'One row per granularity period, in chronological order',
          },
        ],
        description:
          'Dimensions to break the response down by. Combine Period with Broadcast for a joint breakdown. Defaults to no breakdown, returning a single totals row for the whole range with no data rows.',
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        default: '',
        description:
          'The end of the date range. Values in the future are clamped to the current time. Defaults to now.',
      },
      {
        displayName: 'Granularity',
        name: 'granularity',
        type: 'options',
        default: 'daily',
        options: [
          {
            name: 'Daily',
            value: 'daily',
          },
          {
            name: 'Hourly',
            value: 'hourly',
          },
          {
            name: 'Monthly',
            value: 'monthly',
          },
          {
            name: 'Weekly',
            value: 'weekly',
          },
        ],
        description:
          'The bucket size used when Period is one of the selected dimensions. Accepted but has no effect otherwise.',
      },
      {
        displayName: 'Metrics',
        name: 'metrics',
        type: 'multiOptions',
        default: [],
        options: [
          {
            name: 'Bounce Rate',
            value: 'bounce_rate',
          },
          {
            name: 'Bounced',
            value: 'bounced',
          },
          {
            name: 'Bounced Permanent',
            value: 'bounced_permanent',
          },
          {
            name: 'Bounced Transient',
            value: 'bounced_transient',
          },
          {
            name: 'Bounced Undetermined',
            value: 'bounced_undetermined',
          },
          {
            name: 'Click Rate',
            value: 'click_rate',
          },
          {
            name: 'Clicked',
            value: 'clicked',
          },
          {
            name: 'Complained',
            value: 'complained',
          },
          {
            name: 'Complaint Rate',
            value: 'complaint_rate',
          },
          {
            name: 'Delivered',
            value: 'delivered',
          },
          {
            name: 'Delivery Delayed',
            value: 'delivery_delayed',
          },
          {
            name: 'Delivery Rate',
            value: 'delivery_rate',
          },
          {
            name: 'Failed',
            value: 'failed',
          },
          {
            name: 'Open Rate',
            value: 'open_rate',
          },
          {
            name: 'Opened',
            value: 'opened',
          },
          {
            name: 'Sent',
            value: 'sent',
          },
          {
            name: 'Suppressed',
            value: 'suppressed',
          },
          {
            name: 'Unique Clicked',
            value: 'unique_clicked',
          },
          {
            name: 'Unique Opened',
            value: 'unique_opened',
          },
          {
            name: 'Unsubscribe Rate',
            value: 'unsubscribe_rate',
          },
          {
            name: 'Unsubscribed',
            value: 'unsubscribed',
          },
        ],
        description:
          'Metrics to include in the response. Defaults to every available metric when none are selected.',
      },
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'dateTime',
        default: '',
        description:
          'The start of the date range. Must be on or before the end date. Defaults to 6 days before the end date.',
      },
      {
        displayName: 'Timezone',
        name: 'timezone',
        type: 'string',
        default: 'UTC',
        placeholder: 'America/New_York',
        description:
          'The IANA timezone used to bucket periods when Period is one of the selected dimensions',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const options = this.getNodeParameter(
    'broadcastMetricsOptions',
    index,
    {},
  ) as {
    broadcastIds?: string;
    dimensions?: string[];
    endDate?: string;
    granularity?: string;
    metrics?: string[];
    startDate?: string;
    timezone?: string;
  };

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
  if (options.dimensions?.length) {
    qs.dimensions = options.dimensions.join(',');
  }
  if (options.broadcastIds) {
    qs.broadcast_id = options.broadcastIds;
  }

  const response = await apiRequest.call(
    this,
    'GET',
    '/broadcasts/metrics',
    undefined,
    qs,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
