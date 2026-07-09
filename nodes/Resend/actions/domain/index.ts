import type { INodeProperties } from 'n8n-workflow';
import * as claim from './claim.operation';
import * as create from './create.operation';
import * as createTrackingDomain from './createTrackingDomain.operation';
import * as del from './delete.operation';
import * as deleteTrackingDomain from './deleteTrackingDomain.operation';
import * as get from './get.operation';
import * as getClaim from './getClaim.operation';
import * as getTrackingDomain from './getTrackingDomain.operation';
import * as list from './list.operation';
import * as listTrackingDomains from './listTrackingDomains.operation';
import * as update from './update.operation';
import * as verify from './verify.operation';
import * as verifyClaim from './verifyClaim.operation';
import * as verifyTrackingDomain from './verifyTrackingDomain.operation';

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
        name: 'Create Tracking Domain',
        value: 'createTrackingDomain',
        description:
          'Create a custom domain for click and open tracking (private alpha)',
        action: 'Create a tracking domain',
      },
      {
        name: 'Delete',
        value: 'delete',
        description:
          'Remove a sending domain from your account. Emails can no longer be sent from this domain after deletion.',
        action: 'Delete a domain',
      },
      {
        name: 'Delete Tracking Domain',
        value: 'deleteTrackingDomain',
        description: 'Remove an existing click tracking domain (private alpha)',
        action: 'Delete a tracking domain',
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
        name: 'Get Tracking Domain',
        value: 'getTrackingDomain',
        description:
          'Retrieve a single click tracking domain with its DNS records and verification status (private alpha)',
        action: 'Get tracking domain details',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get all sending domains with their verification status and DNS record requirements',
        action: 'List all domains',
      },
      {
        name: 'List Tracking Domains',
        value: 'listTrackingDomains',
        description:
          'List all tracking domains for a given domain (private alpha)',
        action: 'List tracking domains',
      },
      {
        name: 'Update',
        value: 'update',
        description:
          'Update domain settings such as click tracking, open tracking, or TLS requirements',
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
      {
        name: 'Verify Tracking Domain',
        value: 'verifyTrackingDomain',
        description:
          'Trigger DNS verification for a tracking domain (private alpha)',
        action: 'Verify a tracking domain',
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
  ...createTrackingDomain.description,
  ...getTrackingDomain.description,
  ...listTrackingDomains.description,
  ...deleteTrackingDomain.description,
  ...verifyTrackingDomain.description,
];

export { execute } from './execute';
export {
  claim,
  create,
  createTrackingDomain,
  del as delete,
  deleteTrackingDomain,
  get,
  getClaim,
  getTrackingDomain,
  list,
  listTrackingDomains,
  update,
  verify,
  verifyClaim,
  verifyTrackingDomain,
};
