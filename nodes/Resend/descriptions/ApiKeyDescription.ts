import { INodeProperties } from 'n8n-workflow';

export const apiKeyOperations: INodeProperties[] = [
	// API KEY OPERATIONS
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['apiKeys'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new API key',
				action: 'Create an API key',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an API key',
				action: 'Delete an API key',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all API keys',
				action: 'List API keys',
			},
		],
		default: 'list',
	},
];

export const apiKeyFields: INodeProperties[] = [
	// API KEY PROPERTIES
	{
		displayName: 'API Key Name',
		name: 'apiKeyName',
		type: 'string',
		typeOptions: { password: true },
		required: true,
		default: '',
		placeholder: 'My API Key',
		displayOptions: {
			show: {
				resource: ['apiKeys'],
				operation: ['create'],
			},
		},
		description: 'The name of the API key to create',
	},
	{
		displayName: 'API Key ID',
		name: 'apiKeyId',
		type: 'string',
		typeOptions: { password: true },
		required: true,
		default: '',
		placeholder: 'key_123456',
		displayOptions: {
			show: {
				resource: ['apiKeys'],
				operation: ['delete'],
			},
		},
		description: 'The ID of the API key to delete',
	},
	{
		displayName: 'Permission',
		name: 'permission',
		type: 'options',
		options: [
			{ name: 'Full Access', value: 'full_access' },
			{ name: 'Sending Access', value: 'sending_access' },
		],
		default: 'full_access',
		displayOptions: {
			show: {
				resource: ['apiKeys'],
				operation: ['create'],
			},
		},
		description: 'The permission level for the API key',
	},
	{
		displayName: 'Domain ID',
		name: 'domainId',
		type: 'string',
		default: '',
		placeholder: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
		displayOptions: {
			show: {
				resource: ['apiKeys'],
				operation: ['create'],
				permission: ['sending_access'],
			},
		},
		description:
			'Restrict an API key to send emails only from a specific domain. This is only used when the permission is set to sending access.',
	},
];
