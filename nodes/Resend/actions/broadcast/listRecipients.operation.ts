import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { createListExecutionData, requestList } from '../../transport';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';

export const description: INodeProperties[] = [
  createDynamicIdField({
    fieldName: 'broadcastIdRecipients',
    resourceName: 'broadcast',
    displayName: 'Broadcast',
    required: true,
    placeholder: 'bc_123456',
    description:
      'Select a broadcast or enter an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['listRecipients'],
      },
    },
  }),
  {
    displayName: 'Type',
    name: 'recipientType',
    type: 'options',
    default: 'sent',
    required: true,
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['listRecipients'],
      },
    },
    options: [
      {
        name: 'Bounced',
        value: 'bounced',
        description: 'Recipients whose delivery bounced',
      },
      {
        name: 'Clicked',
        value: 'clicked',
        description: 'Recipients who clicked a link in the broadcast',
      },
      {
        name: 'Complained',
        value: 'complained',
        description: 'Recipients who marked the broadcast as spam',
      },
      {
        name: 'Delivered',
        value: 'delivered',
        description: 'Recipients the broadcast was delivered to',
      },
      {
        name: 'Opened',
        value: 'opened',
        description: 'Recipients who opened the broadcast',
      },
      {
        name: 'Sent',
        value: 'sent',
        description: 'Recipients the broadcast was sent to',
      },
      {
        name: 'Suppressed',
        value: 'suppressed',
        description:
          'Recipients skipped because they are on the suppression list',
      },
      {
        name: 'Unsubscribed',
        value: 'unsubscribed',
        description: 'Recipients who unsubscribed after the broadcast',
      },
    ],
    description: 'The recipient event type to list',
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['listRecipients'],
      },
    },
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    default: 50,
    typeOptions: {
      minValue: 1,
    },
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['listRecipients'],
        returnAll: [false],
      },
    },
    description: 'Max number of results to return',
  },
  {
    displayName: 'Email',
    name: 'recipientEmail',
    type: 'string',
    default: '',
    placeholder: 'carter@example.com',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['listRecipients'],
      },
    },
    description: 'Filter the recipients by email address',
  },
  {
    displayName: 'Bounce Type',
    name: 'bounceType',
    type: 'options',
    default: '',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['listRecipients'],
        recipientType: ['bounced'],
      },
    },
    options: [
      {
        name: 'Any',
        value: '',
        description: 'Return bounces of every type',
      },
      {
        name: 'Permanent',
        value: 'permanent',
        description: 'The address is invalid and will never accept mail',
      },
      {
        name: 'Transient',
        value: 'transient',
        description:
          'A temporary problem such as a full mailbox, delivery may succeed later',
      },
      {
        name: 'Undetermined',
        value: 'undetermined',
        description: 'The reason for the bounce could not be determined',
      },
    ],
    description: 'Filter bounced recipients by the type of bounce they had',
  },
];

export async function execute(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[]> {
  const broadcastId = resolveDynamicIdValue(this, 'broadcastIdRecipients', 0);
  const recipientType = this.getNodeParameter('recipientType', 0) as string;
  const recipientEmail = this.getNodeParameter(
    'recipientEmail',
    0,
    '',
  ) as string;
  const bounceType = this.getNodeParameter('bounceType', 0, '') as string;

  const extraQs: IDataObject = { type: recipientType };
  if (recipientEmail) {
    extraQs.email = recipientEmail;
  }
  if (recipientType === 'bounced' && bounceType) {
    extraQs.bounce_type = bounceType;
  }

  const items = await requestList.call(
    this,
    `/broadcasts/${encodeURIComponent(broadcastId)}/recipients`,
    extraQs,
  );
  return createListExecutionData.call(this, items);
}
