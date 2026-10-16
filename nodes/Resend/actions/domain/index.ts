import type { INodeProperties } from 'n8n-workflow';
import * as claim from './claim.operation';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as getClaim from './getClaim.operation';
import * as list from './list.operation';
import * as update from './update.operation';
import * as verify from './verify.operation';
import * as verifyClaim from './verifyClaim.operation';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['domains'],
      },
    },
    options: [
      {
        name: 'Claim',
        value: 'claim',
        description:
          'Claim a domain already verified by another team. Returns a TXT record to add to your DNS for ownership verification.',
        action: 'Claim a domain from another team',
      },
      {
        name: 'Create',
        value: 'create',
        description:
          'Add a new sending domain for email authentication. Returns DNS records that must be configured for verification.',
        action: 'Add a new sending domain',
      },
      {
        name: 'Delete',
        value: 'delete',
        description:
          'Remove a sending domain from your account. Emails can no longer be sent from this domain after deletion.',
        action: 'Delete a domain',
      },
      {
        name: 'Get',
        value: 'get',
        description:
          'Retrieve details of a domain including DNS records, verification status, and configuration',
        action: 'Get domain details',
      },
      {
        name: 'Get Claim',
        value: 'getClaim',
        description:
          'Retrieve the latest claim status for a domain. Poll this endpoint to follow a claim status after starting a claim.',
        action: 'Get domain claim status',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get all sending domains with their verification status and DNS record requirements',
        action: 'List all domains',
      },
      {
        name: 'Update',
        value: 'update',
        description:
          'Update domain settings such as the tracking subdomain, click and open tracking, TLS mode, or capabilities',
        action: 'Update domain settings',
      },
      {
        name: 'Verify',
        value: 'verify',
        description:
          'Trigger verification of DNS records for a domain. Use after configuring DNS to check if domain is ready for sending.',
        action: 'Verify domain DNS records',
      },
      {
        name: 'Verify Claim',
        value: 'verifyClaim',
        description:
          'Trigger DNS verification for a domain claim. Add the TXT record from the Claim operation before calling this.',
        action: 'Verify domain claim ownership',
      },
    ],
    default: 'list',
  },
];

export const descriptions: INodeProperties[] = [
  ...operations,
  ...claim.description,
  ...create.description,
  ...get.description,
  ...getClaim.description,
  ...list.description,
  ...update.description,
  ...del.description,
  ...verify.description,
  ...verifyClaim.description,
];

export { execute } from './execute';
export {
  claim,
  create,
  del as delete,
  get,
  getClaim,
  list,
  update,
  verify,
  verifyClaim,
};
