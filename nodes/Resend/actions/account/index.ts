import type { INodeProperties } from 'n8n-workflow';

import * as disconnect from './disconnect.operation';

export { execute } from './execute';
export { disconnect };

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['account'],
      },
    },
    options: [
      {
        name: 'Disconnect',
        value: 'disconnect',
        description:
          'Revoke the connected Resend OAuth2 grant, ending the connection to your Resend account',
        action: 'Disconnect the Resend account',
      },
    ],
    default: 'disconnect',
  },
];

export const descriptions: INodeProperties[] = [
  ...operations,
  ...disconnect.description,
];
