import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as createTrackingDomain from './createTrackingDomain.operation';
import * as del from './delete.operation';
import * as deleteTrackingDomain from './deleteTrackingDomain.operation';
import * as get from './get.operation';
import * as getTrackingDomain from './getTrackingDomain.operation';
import * as list from './list.operation';
import * as listTrackingDomains from './listTrackingDomains.operation';
import * as update from './update.operation';
import * as verify from './verify.operation';
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
  ...create.description,
  ...get.description,
  ...list.description,
  ...update.description,
  ...del.description,
  ...verify.description,
  ...createTrackingDomain.description,
  ...getTrackingDomain.description,
  ...listTrackingDomains.description,
  ...deleteTrackingDomain.description,
  ...verifyTrackingDomain.description,
];

export { execute } from './execute';
export {
  create,
  createTrackingDomain,
  del as delete,
  deleteTrackingDomain,
  get,
  getTrackingDomain,
  list,
  listTrackingDomains,
  update,
  verify,
  verifyTrackingDomain,
};
