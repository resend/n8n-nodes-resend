import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as list from './list.operation';
import * as update from './update.operation';

export const webhookEventOptions: INodePropertyOptions[] = [
  { name: 'Contact Created', value: 'contact.created' },
  { name: 'Contact Deleted', value: 'contact.deleted' },
  { name: 'Contact Updated', value: 'contact.updated' },
  { name: 'Domain Created', value: 'domain.created' },
  { name: 'Domain Deleted', value: 'domain.deleted' },
  { name: 'Domain Updated', value: 'domain.updated' },
  { name: 'Email Bounced', value: 'email.bounced' },
  { name: 'Email Clicked', value: 'email.clicked' },
  { name: 'Email Complained', value: 'email.complained' },
  { name: 'Email Delivered', value: 'email.delivered' },
  { name: 'Email Delivery Delayed', value: 'email.delivery_delayed' },
  { name: 'Email Failed', value: 'email.failed' },
  { name: 'Email Opened', value: 'email.opened' },
  { name: 'Email Received', value: 'email.received' },
  { name: 'Email Scheduled', value: 'email.scheduled' },
  { name: 'Email Sent', value: 'email.sent' },
  { name: 'Email Suppressed', value: 'email.suppressed' },
];

export const operations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['webhooks'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description:
          'Create a new webhook endpoint to receive real-time notifications for email events like delivered, opened, clicked, bounced',
        action: 'Create a webhook endpoint',
      },
      {
        name: 'Delete',
        value: 'delete',
        description:
          'Delete a webhook endpoint. Events will no longer be sent to this URL.',
        action: 'Delete a webhook',
      },
      {
        name: 'Get',
        value: 'get',
        description:
          'Retrieve details of a webhook including its URL, subscribed events, and status',
        action: 'Get webhook details',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get all configured webhooks with their URLs, event subscriptions, and status',
        action: 'List all webhooks',
      },
      {
        name: 'Update',
        value: 'update',
        description: "Update a webhook's URL or the events it is subscribed to",
        action: 'Update a webhook',
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
];

export { execute } from './execute';
export { create, del as delete, get, list, update };
