import { INodeProperties } from 'n8n-workflow';

export const domainOperations: INodeProperties[] = [
	// DOMAIN OPERATIONS
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
				description: 'Create a new domain',
				action: 'Create a domain',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a domain',
				action: 'Delete a domain',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a domain by ID',
				action: 'Get a domain',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all domains',
				action: 'List domains',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a domain',
				action: 'Update a domain',
			},
			{
				name: 'Verify',
				value: 'verify',
				description: 'Verify a domain',
				action: 'Verify a domain',
			},
		],
		default: 'list',
	},
];

export const domainFields: INodeProperties[] = [
	// DOMAIN PROPERTIES
	{
		displayName: 'Domain Name',
		name: 'domainName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'example.com',
		displayOptions: {
			show: {
				resource: ['domains'],
				operation: ['create'],
			},
		},
		description: 'The name of the domain you want to create',
	},
	{
		displayName: 'Domain ID',
		name: 'domainId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '4dd369bc-aa82-4ff3-97de-514ae3000ee0',
		displayOptions: {
			show: {
				resource: ['domains'],
				operation: ['get', 'verify', 'update', 'delete'],
			},
		},
		description: 'The ID of the domain',
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['domains'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Region',
				name: 'region',
				type: 'options',
				options: [
					{ name: 'US East 1', value: 'us-east-1' },
					{ name: 'EU West 1', value: 'eu-west-1' },
					{ name: 'South America East 1', value: 'sa-east-1' },
					{ name: 'Asia Pacific Northeast 1', value: 'ap-northeast-1' },
				],
				default: 'us-east-1',
				description: 'The region where emails will be sent from',
			},
			{
				displayName: 'Custom Return Path',
				name: 'custom_return_path',
				type: 'string',
				default: 'send',
				description: 'Custom subdomain for the Return-Path address',
			},
		],
	},
	{
		displayName: 'Domain Update Options',
		name: 'domainUpdateOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['domains'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Click Tracking',
				name: 'click_tracking',
				type: 'boolean',
				default: false,
				description: 'Whether to track clicks within the body of each HTML email',
			},
			{
				displayName: 'Open Tracking',
				name: 'open_tracking',
				type: 'boolean',
				default: false,
				description: 'Whether to track the open rate of each email',
			},
			{
				displayName: 'TLS',
				name: 'tls',
				type: 'options',
				options: [
					{ name: 'Opportunistic', value: 'opportunistic' },
					{ name: 'Enforced', value: 'enforced' },
				],
				default: 'opportunistic',
				description: 'TLS setting for email delivery. Opportunistic attempts secure connection but falls back to unencrypted if needed. Enforced requires TLS and will not send if unavailable.',
			},
		],
	},
];
