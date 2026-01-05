import { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

const webhookEventOptions: INodePropertyOptions[] = [
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
	{ name: 'Email Opened', value: 'email.opened' },
	{ name: 'Email Sent', value: 'email.sent' },
];

export const webhookOperations: INodeProperties[] = [
	// WEBHOOK OPERATIONS
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
				description: 'Create a webhook',
				action: 'Create a webhook',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a webhook',
				action: 'Delete a webhook',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a webhook',
				action: 'Get a webhook',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List webhooks',
				action: 'List webhooks',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a webhook',
				action: 'Update a webhook',
			},
		],
		default: 'list',
	},
];

export const webhookFields: INodeProperties[] = [
	// WEBHOOK PROPERTIES
	{
		displayName: 'Endpoint',
		name: 'webhookEndpoint',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'https://example.com/webhooks/resend',
		displayOptions: {
			show: {
				resource: ['webhooks'],
				operation: ['create'],
			},
		},
		description: 'Public HTTPS URL where webhook events will be delivered.',
	},
	{
		displayName: 'Events',
		name: 'webhookEvents',
		type: 'multiOptions',
		required: true,
		default: ['email.sent'],
		displayOptions: {
			show: {
				resource: ['webhooks'],
				operation: ['create'],
			},
		},
		options: webhookEventOptions,
		description: 'Events that should trigger webhook delivery.',
	},
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
		displayOptions: {
			show: {
				resource: ['webhooks'],
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'The ID of the webhook.',
	},
	{
		displayName: 'Update Fields',
		name: 'webhookUpdateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['webhooks'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Endpoint',
				name: 'endpoint',
				type: 'string',
				default: '',
				placeholder: 'https://example.com/webhooks/resend',
				description: 'Public HTTPS URL where webhook events will be delivered.',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				default: ['email.sent'],
				options: webhookEventOptions,
				description: 'Events that should trigger webhook delivery.',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'enabled',
				options: [
					{ name: 'Enabled', value: 'enabled' },
					{ name: 'Disabled', value: 'disabled' },
				],
				description: 'Whether the webhook should be enabled or disabled.',
			},
		],
	},
];
