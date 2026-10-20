import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { requestList } from '../../transport';
import {
  buildThreadFilterQuery,
  createInboxField,
  createListFields,
  getInboxPath,
  threadFilterOptions,
} from './shared';

export const description: INodeProperties[] = [
  createInboxField('inboxThreads', ['list']),
  ...createListFields('inboxThreads', 'list'),
  {
    displayName: 'Filters',
    name: 'inboxThreadFilters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxThreads'],
        operation: ['list'],
      },
    },
    options: threadFilterOptions,
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const filters = this.getNodeParameter(
    'inboxThreadFilters',
    index,
    {},
  ) as IDataObject;

  const items = await requestList.call(
    this,
    `${getInboxPath(this, index)}/threads`,
    buildThreadFilterQuery(this, filters, index),
    index,
  );
  return items.map((item) => ({ json: item, pairedItem: { item: index } }));
}
