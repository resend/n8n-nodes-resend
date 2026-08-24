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
    name: 'segmentMetricsOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['segments'],
        operation: ['getMetrics'],
      },
    },
    options: [
      {
        displayName: 'Dimensions',
        name: 'dimensions',
        type: 'multiOptions',
        default: [],
        options: [
          {
            name: 'Segment',
            value: 'segment',
            description:
              'One row per segment, using its current contact counts',
          },
        ],
        description:
          'List of dimensions to break the data down by. Defaults to an empty list, returning only totals with no data.',
      },
      {
        displayName: 'Metrics',
        name: 'metrics',
        type: 'multiOptions',
        default: [],
        options: [
          {
            name: 'All Contacts',
            value: 'all_contacts',
          },
          {
            name: 'Subscribers',
            value: 'subscribers',
          },
          {
            name: 'Unsubscribers',
            value: 'unsubscribers',
          },
        ],
        description:
          'List of metrics to include in the totals and data. Defaults to all of the following: all_contacts, subscribers, unsubscribers.',
      },
      {
        displayName: 'Segment IDs',
        name: 'segmentIds',
        type: 'string',
        default: '',
        placeholder: 'seg_123456,seg_789012',
        description:
          'Comma-separated list of segment IDs. Narrows the totals (and data, when requested) to just these segments, without double-counting contacts that belong to more than one.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const options = this.getNodeParameter('segmentMetricsOptions', index, {}) as {
    dimensions?: string[];
    metrics?: string[];
    segmentIds?: string;
  };

  const qs: IDataObject = {};

  if (options.dimensions?.length) {
    qs.dimensions = options.dimensions.join(',');
  }

  if (options.metrics?.length) {
    qs.metrics = options.metrics.join(',');
  }

  const segmentIds = (options.segmentIds ?? '')
    .split(',')
    .map((segmentId) => segmentId.trim())
    .filter((segmentId) => segmentId);

  if (segmentIds.length) {
    qs.segment_id = segmentIds.join(',');
  }

  const response = await apiRequest.call(
    this,
    'GET',
    '/segments/metrics',
    undefined,
    qs,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
