import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as getEvent from './getEvent.operation';
import * as list from './list.operation';
import * as listEventAttempts from './listEventAttempts.operation';
import * as listEvents from './listEvents.operation';
import * as replayEvent from './replayEvent.operation';
import * as rotateSigningSecret from './rotateSigningSecret.operation';
import * as update from './update.operation';

export { webhookEventOptions } from './events';

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
        name: 'Get Event',
        value: 'getEvent',
        description:
          'Retrieve a single event delivered to a webhook, including its payload and delivery status',
        action: 'Get a webhook event',
      },
      {
        name: 'List',
        value: 'list',
        description:
          'Get all configured webhooks with their URLs, event subscriptions, and status',
        action: 'List all webhooks',
      },
      {
        name: 'List Event Attempts',
        value: 'listEventAttempts',
        description:
          'Retrieve the delivery attempts of a webhook event, most recent first',
        action: 'List webhook event attempts',
      },
      {
        name: 'List Events',
        value: 'listEvents',
        description:
          'Retrieve the events delivered to a webhook, most recent first',
        action: 'List webhook events',
      },
      {
        name: 'Replay Event',
        value: 'replayEvent',
        description:
          'Queue one more delivery of a webhook event. The webhook must be enabled.',
        action: 'Replay a webhook event',
      },
      {
        name: 'Rotate Signing Secret',
        value: 'rotateSigningSecret',
        description:
          'Generate a new signing secret for a webhook. The previous secret stays valid for 24 hours.',
        action: 'Rotate a webhook signing secret',
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
  ...rotateSigningSecret.description,
  ...listEvents.description,
  ...getEvent.description,
  ...replayEvent.description,
  ...listEventAttempts.description,
];

export { execute } from './execute';
export {
  create,
  del as delete,
  get,
  getEvent,
  list,
  listEventAttempts,
  listEvents,
  replayEvent,
  rotateSigningSecret,
  update,
};
