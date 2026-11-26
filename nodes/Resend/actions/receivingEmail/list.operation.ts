import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
  createListExecutionData,
  normalizeIdList,
  requestList,
} from '../../transport';

const MAX_TO_VALUES = 20;

export const description: INodeProperties[] = [
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['receivingEmails'],
        operation: ['list'],
      },
    },
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    typeOptions: {
      minValue: 1,
    },
    displayOptions: {
      show: {
        resource: ['receivingEmails'],
        operation: ['list'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  {
    displayName: 'Filters',
    name: 'receivingEmailListFilters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['receivingEmails'],
        operation: ['list'],
      },
    },
    options: [
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'string',
        default: '',
        placeholder: '2026-11-30',
        description:
          'Returns emails received on or before this date. Same formats as Start Date. A date covers that whole day. A timestamp is used as given.',
      },
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'string',
        default: '',
        placeholder: '2026-11-01',
        description:
          'Returns emails received on or after this date. Accepts a date like 2026-11-01 or an ISO 8601 timestamp, in UTC unless the timestamp has an offset.',
      },
      {
        displayName: 'To',
        name: 'to',
        type: 'string',
        default: '',
        placeholder: 'support@example.com, billing@example.com',
        description:
          'Comma-separated recipient addresses. Returns emails received by any of them. Each value must match the address exactly, including case. Up to 20 values.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const filters = this.getNodeParameter(
    'receivingEmailListFilters',
    0,
    {},
  ) as IDataObject;

  const qs: IDataObject = {};
  const to = normalizeIdList(filters.to as string | string[]);
  if (to) {
    const count = to.split(',').length;
    if (count > MAX_TO_VALUES) {
      throw new NodeOperationError(
        this.getNode(),
        `To accepts at most ${MAX_TO_VALUES} values (got ${count})`,
      );
    }
    qs.to = to;
  }
  for (const [key, param] of [
    ['startDate', 'start_date'],
    ['endDate', 'end_date'],
  ]) {
    const value = String(filters[key] ?? '').trim();
    if (value) {
      qs[param] = value;
    }
  }

  const items = await requestList.call(this, '/emails/receiving', qs);
  return createListExecutionData.call(this, items);
}
