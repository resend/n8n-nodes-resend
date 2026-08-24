import type { INodeProperties } from 'n8n-workflow';

import * as disconnect from './disconnect.operation';
import * as listGrants from './listGrants.operation';
import * as revokeGrant from './revokeGrant.operation';

export { execute } from './execute';
export { disconnect, listGrants, revokeGrant };

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
        action: 'Disconnect the resend account',
      },
      {
        name: 'List Grants',
        value: 'listGrants',
        description:
          'Retrieve the OAuth grants issued by your team, including revoked ones',
        action: 'List oauth grants',
      },
      {
        name: 'Revoke Grant',
        value: 'revokeGrant',
        description:
          'Revoke an OAuth grant by ID, immediately disconnecting that OAuth client',
        action: 'Revoke an oauth grant',
      },
    ],
    default: 'disconnect',
  },
];

export const descriptions: INodeProperties[] = [
  ...operations,
  ...disconnect.description,
  ...listGrants.description,
  ...revokeGrant.description,
];
