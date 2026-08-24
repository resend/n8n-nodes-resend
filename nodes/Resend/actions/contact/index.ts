import type { INodeProperties } from 'n8n-workflow';
import * as addToSegment from './addToSegment.operation';
import * as create from './create.operation';
import * as createImport from './createImport.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as getImport from './getImport.operation';
import * as getTopics from './getTopics.operation';
import * as list from './list.operation';
import * as listImports from './listImports.operation';
import * as listSegments from './listSegments.operation';
import * as removeFromSegment from './removeFromSegment.operation';
import * as update from './update.operation';
import * as updateTopics from './updateTopics.operation';

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['contacts'],
      },
    },
    options: [
      {
        name: 'Add to Segment',
        value: 'addToSegment',
        description:
          'Add an existing contact to a segment by providing the contact ID and segment ID',
        action: 'Add contact to a segment',
      },
      {
        name: 'Create',
        value: 'create',
        description:
          'Create a new contact with email address, optional name, custom properties, and segment/topic assignments',
        action: 'Create a new contact',
      },
      {
        name: 'Create Import',
        value: 'createImport',
        description:
          'Import contacts in bulk from a CSV file, optionally mapping columns and assigning segments and topics',
        action: 'Create a contact import',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Permanently delete a contact by their contact ID',
        action: 'Delete a contact',
      },
      {
        name: 'Get',
        value: 'get',
        description:
          "Retrieve a contact's details including email, name, properties, and subscription status by contact ID",
        action: 'Get contact details',
      },
      {
        name: 'Get Import',
        value: 'getImport',
        description:
          'Retrieve a single contact import with its status and the counts of created, updated, skipped, and failed rows',
        action: 'Get a contact import',
      },
      {
        name: 'Get Topics',
        value: 'getTopics',
        description:
          'Get all topic subscriptions (opt-in/opt-out status) for a specific contact',
        action: 'Get contact topic subscriptions',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get a list of all contacts in the account with their email addresses and basic information',
        action: 'List all contacts',
      },
      {
        name: 'List Imports',
        value: 'listImports',
        description:
          'Retrieve a list of contact imports, optionally filtered by status',
        action: 'List contact imports',
      },
      {
        name: 'List Segments',
        value: 'listSegments',
        description: 'Get all segments that a specific contact belongs to',
        action: 'List contact segments',
      },
      {
        name: 'Remove From Segment',
        value: 'removeFromSegment',
        description:
          'Remove a contact from a segment by providing the contact ID and segment ID',
        action: 'Remove contact from segment',
      },
      {
        name: 'Update',
        value: 'update',
        description:
          "Update a contact's information including name, email, properties, or unsubscribe status",
        action: 'Update contact details',
      },
      {
        name: 'Update Topics',
        value: 'updateTopics',
        description:
          "Update a contact's topic subscription preferences (opt-in or opt-out of specific topics)",
        action: 'Update contact topic subscriptions',
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
  ...addToSegment.description,
  ...listSegments.description,
  ...removeFromSegment.description,
  ...getTopics.description,
  ...updateTopics.description,
  ...createImport.description,
  ...listImports.description,
  ...getImport.description,
];

export { execute } from './execute';
export {
  addToSegment,
  create,
  createImport,
  del as delete,
  get,
  getImport,
  getTopics,
  list,
  listImports,
  listSegments,
  removeFromSegment,
  update,
  updateTopics,
};
