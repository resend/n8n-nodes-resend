import type { INodeProperties } from 'n8n-workflow';

import * as list from './list.operation';
import * as retrieve from './retrieve.operation';

export { execute } from './execute';
export { list, retrieve };

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['logs'],
      },
    },
    options: [
      {
        name: 'List',
        value: 'list',
        description:
          'Get all API request logs for the account including request and response details',
        action: 'List all logs',
      },
      {
        name: 'Retrieve',
        value: 'retrieve',
        description:
          'Retrieve details of a specific log entry including the request body, response body, and response status',
        action: 'Retrieve a log entry',
      },
    ],
    default: 'list',
  },
];

export const descriptions: INodeProperties[] = [
  ...operations,
  ...list.description,
  ...retrieve.description,
];
