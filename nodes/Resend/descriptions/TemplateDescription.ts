import { INodeProperties } from 'n8n-workflow';

export const templateOperations: INodeProperties[] = [
	// TEMPLATE OPERATIONS
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['templates'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new template',
				action: 'Create a template',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a template',
				action: 'Delete a template',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a template by ID',
				action: 'Get a template',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all templates',
				action: 'List templates',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a template',
				action: 'Update a template',
			},
		],
		default: 'list',
	},
];

export const templateFields: INodeProperties[] = [
	// TEMPLATE PROPERTIES
	{
		displayName: 'Name',
		name: 'templateName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'order-confirmation',
		displayOptions: {
			show: {
				resource: ['templates'],
				operation: ['create'],
			},
		},
		description: 'The name of the template',
	},
	{
		displayName: 'From',
		name: 'templateFrom',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Resend Store <store@resend.com>',
		displayOptions: {
			show: {
				resource: ['templates'],
				operation: ['create'],
			},
		},
		description:
			'Sender email address. To include a friendly name, use the format "Your Name &lt;sender@domain.com&gt;".',
	},
	{
		displayName: 'Subject',
		name: 'templateSubject',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Thanks for your order!',
		displayOptions: {
			show: {
				resource: ['templates'],
				operation: ['create'],
			},
		},
		description: 'Default subject line for the template',
	},
	{
		displayName: 'HTML Content',
		name: 'templateHtml',
		type: 'string',
		required: true,
		default: '',
		typeOptions: {
			multiline: true,
			rows: 4,
		},
		placeholder: '<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>',
		displayOptions: {
			show: {
				resource: ['templates'],
				operation: ['create'],
			},
		},
		description: 'HTML version of the template',
	},
	{
		displayName: 'Template Variables',
		name: 'templateVariables',
		type: 'fixedCollection',
		default: { variables: [] },
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['templates'],
				operation: ['create', 'update'],
			},
		},
		description: 'Define variables used in the template',
		options: [
			{
				name: 'variables',
				displayName: 'Variable',
				values: [
					{
						displayName: 'Key',
						name: 'key',
						type: 'string',
						required: true,
						default: '',
						description: 'Variable name (we recommend uppercase, e.g. PRODUCT)',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						default: 'string',
						options: [
							{ name: 'String', value: 'string' },
							{ name: 'Number', value: 'number' },
						],
						description: 'Variable data type',
					},
					{
						displayName: 'Fallback Value',
						name: 'fallbackValue',
						type: 'string',
						default: '',
						description: 'Fallback value used when a variable is not provided',
					},
				],
			},
		],
	},
	{
		displayName: 'Template Name or ID',
		name: 'templateId',
		type: 'options',
		required: true,
		default: '',
		placeholder: '34a080c9-b17d-4187-ad80-5af20266e535',
		typeOptions: {
			loadOptionsMethod: 'getTemplates',
		},
		displayOptions: {
			show: {
				resource: ['templates'],
				operation: ['get', 'update', 'delete'],
			},
		},
		description:
			'Select a template or enter an ID/alias using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Update Fields',
		name: 'templateUpdateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['templates'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Alias',
				name: 'alias',
				type: 'string',
				default: '',
				description: 'Template alias',
			},
			{
				displayName: 'From',
				name: 'from',
				type: 'string',
				default: '',
				description: 'Sender email address',
			},
			{
				displayName: 'HTML Content',
				name: 'html',
				type: 'string',
				default: '',
				typeOptions: {
					multiline: true,
					rows: 4,
				},
				description: 'HTML content of the template',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Template name',
			},
			{
				displayName: 'Reply To',
				name: 'reply_to',
				type: 'string',
				default: '',
				description: 'Reply-to email address. For multiple addresses, use comma-separated values.',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
				description: 'Default subject line for the template',
			},
			{
				displayName: 'Text Content',
				name: 'text',
				type: 'string',
				default: '',
				typeOptions: {
					multiline: true,
					rows: 4,
				},
				description:
					'Plain text content. Set to an empty string to disable automatic plain text generation.',
			},
		],
	},
];
