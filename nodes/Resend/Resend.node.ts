import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

export class Resend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Resend',
		name: 'resend',
		icon: 'file:resend-icon-white.svg',
		group: ['output'],
		version: 1,
		description: 'Interact with Resend API for emails, templates, domains, API keys, broadcasts, segments, topics, and contacts',
		defaults: {
			name: 'Resend',
		},
		credentials: [
			{
				name: 'resendApi',
				required: true,
			},
		],
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
		properties: [
			// Resource selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true, options: [
					{
						name: 'API Key',
						value: 'apiKeys',
						description: 'Manage API keys',
					},
					{
						name: 'Broadcast',
						value: 'broadcasts',
						description: 'Manage email broadcasts',
					},
					{
						name: 'Contact',
						value: 'contacts',
						description: 'Manage contacts',
					},
					{
						name: 'Domain',
						value: 'domains',
						description: 'Manage email domains',
					},
					{
						name: 'Email',
						value: 'email',
						description: 'Send and manage emails',
					},
					{
						name: 'Segment',
						value: 'segments',
						description: 'Manage contact segments',
					},
					{
						name: 'Topic',
						value: 'topics',
						description: 'Manage subscription topics',
					},
					{
						name: 'Template',
						value: 'templates',
						description: 'Manage email templates',
					},
				],
				default: 'email',
			},

			// EMAIL OPERATIONS
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['email'],
					},
				}, options: [
					{
						name: 'Cancel',
						value: 'cancel',
						description: 'Cancel a scheduled email',
						action: 'Cancel an email',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List sent emails',
						action: 'List emails',
					},
					{
						name: 'Retrieve',
						value: 'retrieve',
						description: 'Retrieve an email by ID',
						action: 'Retrieve an email',
					},
					{
						name: 'Send',
						value: 'send',
						description: 'Send an email',
						action: 'Send an email',
					},
					{
						name: 'Send Batch',
						value: 'sendBatch',
						description: 'Send multiple emails at once',
						action: 'Send batch emails',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update an email',
						action: 'Update an email',
					},
				],
				default: 'send',
			}, {
				displayName: 'Email Format',
				name: 'emailFormat',
				type: 'options',
				options: [
					{
						name: 'HTML',
						value: 'html',
						description: 'Send email with HTML content',
					},
					{
						name: 'HTML and Text',
						value: 'both',
						description: 'Send email with both HTML and text content',
					},
					{
						name: 'Text',
						value: 'text',
						description: 'Send email with plain text content',
					},
				],
				default: 'html',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['send', 'sendBatch'],
					},
				},
				description: 'Choose the format for your email content. HTML allows rich formatting, text is simple and universally compatible.',
			},
			// Properties for "Send Email" operation
			{
				displayName: 'From',
				name: 'from',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'you@example.com',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['send'],
					},
				},
				description: 'Sender email address. To include a friendly name, use the format "Your Name &lt;sender@domain.com&gt;".',
			},
			{
				displayName: 'To',
				name: 'to',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'user@example.com',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['send'],
					},
				},
				description: 'Recipient email address. For multiple addresses, separate with commas (max 50).',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Hello from n8n!',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['send'],
					},
				},
				description: 'Email subject line',
			}, {
				displayName: 'HTML Content',
				name: 'html',
				type: 'string',
				default: '',
				typeOptions: {
					multiline: true,
					rows: 4,
				},
				placeholder: '<p>Your HTML content here</p>',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['send'],
						emailFormat: ['html', 'both'],
					},
				},
				description: 'HTML version of the email content',
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
				placeholder: 'Your plain text content here',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['send'],
						emailFormat: ['text', 'both'],
					},
				},
				description: 'Plain text version of the email content',
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['send'],
					},
				},				options: [
					{
						displayName: 'Attachments',
						name: 'attachments',
						type: 'fixedCollection',
						default: { attachments: [] },
						typeOptions: {
							multipleValues: true,
						},
						description: 'Email attachments (not supported with scheduled emails or batch emails)',
						options: [
							{
								name: 'attachments',
								displayName: 'Attachment',
								values: [
									{
										displayName: 'Attachment Type',
										name: 'attachmentType',
										type: 'options',
										default: 'binaryData',
										options: [
											{
												name: 'Binary Data',
												value: 'binaryData',
												description: 'Use binary data from previous node',
											},
											{
												name: 'Remote URL',
												value: 'url',
												description: 'Use a URL to a remote file',
											},
										],
									},
									{
										displayName: 'Binary Property',
										name: 'binaryPropertyName',
										type: 'string',
										default: 'data',
										placeholder: 'data',
										description: 'Name of the binary property which contains the file data',
										displayOptions: {
											show: {
												attachmentType: ['binaryData'],
											},
										},
									},
									{
										displayName: 'File URL',
										name: 'fileUrl',
										type: 'string',
										default: '',
										placeholder: 'https://example.com/file.pdf',
										description: 'URL to the remote file',
										displayOptions: {
											show: {
												attachmentType: ['url'],
											},
										},
									},									{
										displayName: 'File Name',
										name: 'filename',
										type: 'string',
										default: '',
										placeholder: 'document.pdf',
										description: 'Name for the attached file (required for both binary data and URL)',
									},
								],
							},
						],
					},
					{
						displayName: 'BCC',
						name: 'bcc',
						type: 'string',
						default: '',
						description: 'BCC recipient email addresses (comma-separated)',
					},
					{
						displayName: 'CC',
						name: 'cc',
						type: 'string',
						default: '',
						description: 'CC recipient email addresses (comma-separated)',
					},
					{
						displayName: 'Reply To',
						name: 'reply_to',
						type: 'string',
						default: '',
						description: 'Reply-to email address. For multiple addresses, use comma-separated values.',
					},
					{
						displayName: 'Headers',
						name: 'headers',
						type: 'fixedCollection',
						default: { headers: [] },
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'headers',
								displayName: 'Header',
								values: [
									{
										displayName: 'Name',
										name: 'name',
										type: 'string',
										required: true,
										default: '',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
									},
								],
							},
						],
						description: 'Custom headers to add to the email',
					},
					{
						displayName: 'Tags',
						name: 'tags',
						type: 'fixedCollection',
						default: { tags: [] },
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'tags',
								displayName: 'Tag',
								values: [
									{
										displayName: 'Name',
										name: 'name',
										type: 'string',
										required: true,
										default: '',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										required: true,
										default: '',
									},
								],
							},
						],
						description: 'Tags to attach to the email',
					},
					{
						displayName: 'Topic ID',
						name: 'topic_id',
						type: 'string',
						default: '',
						description: 'Topic ID to scope the email to',
					},
					{
						displayName: 'Scheduled At',
						name: 'scheduled_at',
						type: 'string',
						default: '',
						description: 'Schedule email to be sent later (e.g., "in 1 min" or ISO 8601 format)',
					},
				],
			},

			// EMAIL PROPERTIES - Send Batch operation
			{
				displayName: 'Emails',
				name: 'emails',
				type: 'fixedCollection',
				required: true,
				default: { emails: [{}] },
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['sendBatch'],
					},
				},
				description: 'Array of emails to send (max 100). Note: Attachments are not supported with batch emails.', options: [{
					name: 'emails',
					displayName: 'Email',
					values: [
						{
							displayName: 'From',
							name: 'from',
							type: 'string',
							required: true,
							default: '',
							placeholder: 'you@example.com',
							description: 'Sender email address',
						},
						{
							displayName: 'HTML Content',
							name: 'html',
							type: 'string',
							default: '',
							description: 'HTML content of the email',
							placeholder: '<p>Your HTML content here</p>',
							typeOptions: {
								rows: 4
							},
						displayOptions: {
							show: {
								'/emailFormat': ['html', 'both'],
							},
						},
					},
						{
							displayName: 'Subject',
							name: 'subject',
							type: 'string',
							required: true,
							default: '',
							placeholder: 'Hello from n8n!',
							description: 'Email subject',
						},
						{
							displayName: 'Text Content',
							name: 'text',
							type: 'string',
							default: '',
							description: 'Plain text content of the email',
							typeOptions: {
								rows: 4
							},
							placeholder: 'Your plain text content here',
						displayOptions: {
							show: {
								'/emailFormat': ['text', 'both'],
							},
						},
					},
						{
							displayName: 'To',
							name: 'to',
							type: 'string',
							required: true,
							default: '',
							placeholder: 'user@example.com',
							description: 'Recipient email address (comma-separated for multiple)',
						},
					],
				},
				],
			},

			// EMAIL PROPERTIES - Retrieve/Update/Cancel operations
			{
				displayName: 'Email ID',
				name: 'emailId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'ae2014de-c168-4c61-8267-70d2662a1ce1',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['retrieve', 'update', 'cancel'],
					},
				},
				description: 'The ID of the email to retrieve, update, or cancel',
			},
			{
				displayName: 'Scheduled At',
				name: 'scheduled_at',
				type: 'string',
				default: '',
				placeholder: '2024-08-05T11:52:01.858Z',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['update'],
					},
				},
				description: 'Schedule email to be sent later. The date should be in ISO 8601 format (e.g., 2024-08-05T11:52:01.858Z).',
			},
			{
				displayName: 'List Options',
				name: 'emailListOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 20,
						description: 'Max number of emails to return (1-100)',
					},
					{
						displayName: 'After',
						name: 'after',
						type: 'string',
						default: '',
						description: 'Return results after this email ID',
					},
					{
						displayName: 'Before',
						name: 'before',
						type: 'string',
						default: '',
						description: 'Return results before this email ID',
					},
				],
			},

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
				description: 'Sender email address. To include a friendly name, use the format "Your Name <sender@domain.com>".',
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
				displayName: 'Template ID',
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
						operation: ['get', 'update', 'delete', 'send'],
					},
				},
				description: 'Select a template or enter an ID/alias using an expression',
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
						description: 'Plain text content. Set to an empty string to disable automatic plain text generation.',
					},
				],
			},
			{
				displayName: 'List Options',
				name: 'templateListOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['templates'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 20,
						description: 'Max number of templates to return (1-100)',
					},
					{
						displayName: 'After',
						name: 'after',
						type: 'string',
						default: '',
						description: 'Return results after this template ID',
					},
					{
						displayName: 'Before',
						name: 'before',
						type: 'string',
						default: '',
						description: 'Return results before this template ID',
					},
				],
			},
			{
				displayName: 'From',
				name: 'templateSendFrom',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Acme <onboarding@resend.dev>',
				displayOptions: {
					show: {
						resource: ['templates'],
						operation: ['send'],
					},
				},
				description: 'Sender email address',
			},
			{
				displayName: 'To',
				name: 'templateSendTo',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'delivered@resend.dev',
				displayOptions: {
					show: {
						resource: ['templates'],
						operation: ['send'],
					},
				},
				description: 'Recipient email address. For multiple addresses, separate with commas.',
			},
			{
				displayName: 'Template Variables',
				name: 'templateSendVariables',
				type: 'fixedCollection',
				default: { variables: [] },
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['templates'],
						operation: ['send'],
					},
				},
				description: 'Variables to render the template with',
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
								description: 'Template variable name',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value for the template variable',
							},
						],
					},
				],
			},

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
				description: 'Restrict an API key to send emails only from a specific domain. This is only used when the permission is set to sending access.',
			},

			// BROADCAST PROPERTIES
			{
				displayName: 'Broadcast ID',
				name: 'broadcastId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'bc_123456',
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['get', 'update', 'send', 'delete'],
					},
				},
				description: 'The ID of the broadcast',
			},
			{
				displayName: 'Segment ID',
				name: 'segmentId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'seg_123456',
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['create'],
					},
				},
				description: 'The ID of the segment for this broadcast',
			},
			{
				displayName: 'From',
				name: 'broadcastFrom',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'you@example.com',
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['create'],
					},
				},
				description: 'Sender email address. To include a friendly name, use the format "Your Name <sender@domain.com>".',
			},
			{
				displayName: 'Subject',
				name: 'broadcastSubject',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Newsletter Subject',
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['create'],
					},
				},
				description: 'Email subject',
			},
			{
				displayName: 'HTML Content',
				name: 'broadcastHtml',
				type: 'string',
				required: true,
				default: '',
				typeOptions: {
					multiline: true,
				},
				placeholder: '<p>Your HTML content here with {{{FIRST_NAME|there}}} and {{{RESEND_UNSUBSCRIBE_URL}}}</p>',
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['create'],
					},
				},
				description: 'The HTML version of the message. You can use variables like {{{FIRST_NAME|fallback}}} and {{{RESEND_UNSUBSCRIBE_URL}}}.',
			},
			{
				displayName: 'Create Options',
				name: 'broadcastCreateOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						placeholder: 'Internal broadcast name',
						description: 'The friendly name of the broadcast. Only used for internal reference.',
					},
					{
						displayName: 'Reply To',
						name: 'reply_to',
						type: 'string',
						default: '',
						placeholder: 'noreply@example.com',
						description: 'Reply-to email address. For multiple addresses, use comma-separated values.',
					},
					{
						displayName: 'Text Content',
						name: 'text',
						type: 'string',
						default: '',
						typeOptions: {
							multiline: true,
						},
						placeholder: 'Your plain text content here',
						description: 'The plain text version of the message',
					},
					{
						displayName: 'Topic ID',
						name: 'topic_id',
						type: 'string',
						default: '',
						placeholder: 'topic_123456',
						description: 'Topic ID that the broadcast will be scoped to',
					},
				],
			},
			{
				displayName: 'Update Fields',
				name: 'broadcastUpdateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Segment ID',
						name: 'segment_id',
						type: 'string',
						default: '',
						placeholder: 'seg_123456',
						description: 'The ID of the segment you want to send to',
					},
					{
						displayName: 'From',
						name: 'from',
						type: 'string',
						default: '',
						placeholder: 'you@example.com',
						description: 'Sender email address',
					},
					{
						displayName: 'Subject',
						name: 'subject',
						type: 'string',
						default: '',
						placeholder: 'Newsletter Subject',
						description: 'Email subject',
					},
					{
						displayName: 'HTML Content',
						name: 'html',
						type: 'string',
						default: '',
						typeOptions: {
							multiline: true,
						},
						placeholder: '<p>Your HTML content here</p>',
						description: 'The HTML version of the message',
					},
					{
						displayName: 'Text Content',
						name: 'text',
						type: 'string',
						default: '',
						typeOptions: {
							multiline: true,
						},
						placeholder: 'Your plain text content here',
						description: 'The plain text version of the message',
					},
					{
						displayName: 'Reply To',
						name: 'reply_to',
						type: 'string',
						default: '',
						placeholder: 'noreply@example.com',
						description: 'Reply-to email address. For multiple addresses, use comma-separated values.',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						placeholder: 'Internal broadcast name',
						description: 'The friendly name of the broadcast. Only used for internal reference.',
					},
					{
						displayName: 'Topic ID',
						name: 'topic_id',
						type: 'string',
						default: '',
						placeholder: 'topic_123456',
						description: 'Topic ID that the broadcast will be scoped to',
					},
				],
			},
			{
				displayName: 'Send Options',
				name: 'broadcastSendOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['send'],
					},
				},
				options: [
					{
						displayName: 'Scheduled At',
						name: 'scheduled_at',
						type: 'string',
						default: '',
						placeholder: 'in 1 min',
						description: 'Schedule the broadcast to be sent later (natural language or ISO 8601).',
					},
				],
			},
			{
				displayName: 'List Options',
				name: 'broadcastListOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 20,
						description: 'Max number of broadcasts to return (1-100)',
					},
					{
						displayName: 'After',
						name: 'after',
						type: 'string',
						default: '',
						description: 'Return results after this broadcast ID',
					},
					{
						displayName: 'Before',
						name: 'before',
						type: 'string',
						default: '',
						description: 'Return results before this broadcast ID',
					},
				],
			},

			// SEGMENT PROPERTIES
			{
				displayName: 'Segment Name',
				name: 'segmentName',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Registered Users',
				displayOptions: {
					show: {
						resource: ['segments'],
						operation: ['create'],
					},
				},
				description: 'The name of the segment',
			},
			{
				displayName: 'Segment ID',
				name: 'segmentId',
				type: 'options',
				required: true,
				default: '',
				placeholder: 'seg_123456',
				typeOptions: {
					loadOptionsMethod: 'getSegments',
				},
				displayOptions: {
					show: {
						resource: ['segments'],
						operation: ['get', 'delete'],
					},
				},
				description: 'Select a segment or enter an ID using an expression',
			},
			{
				displayName: 'List Options',
				name: 'segmentListOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['segments'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 20,
						description: 'Max number of segments to return (1-100)',
					},
					{
						displayName: 'After',
						name: 'after',
						type: 'string',
						default: '',
						description: 'Return results after this segment ID',
					},
					{
						displayName: 'Before',
						name: 'before',
						type: 'string',
						default: '',
						description: 'Return results before this segment ID',
					},
				],
			},

			// TOPIC PROPERTIES
			{
				displayName: 'Topic Name',
				name: 'topicName',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Weekly Newsletter',
				displayOptions: {
					show: {
						resource: ['topics'],
						operation: ['create'],
					},
				},
				description: 'The name of the topic',
			},
			{
				displayName: 'Default Subscription',
				name: 'topicDefaultSubscription',
				type: 'options',
				required: true,
				default: 'opt_in',
				displayOptions: {
					show: {
						resource: ['topics'],
						operation: ['create'],
					},
				},
				options: [
					{ name: 'Opt In', value: 'opt_in' },
					{ name: 'Opt Out', value: 'opt_out' },
				],
				description: 'Default subscription preference for new contacts',
			},
			{
				displayName: 'Create Options',
				name: 'topicCreateOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['topics'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Short description of the topic',
					},
					{
						displayName: 'Visibility',
						name: 'visibility',
						type: 'options',
						default: 'private',
						options: [
							{ name: 'Private', value: 'private' },
							{ name: 'Public', value: 'public' },
						],
						description: 'Visibility on the unsubscribe page',
					},
				],
			},
			{
				displayName: 'Topic ID',
				name: 'topicId',
				type: 'options',
				required: true,
				default: '',
				placeholder: 'topic_123456',
				typeOptions: {
					loadOptionsMethod: 'getTopics',
				},
				displayOptions: {
					show: {
						resource: ['topics'],
						operation: ['get', 'update', 'delete'],
					},
				},
				description: 'Select a topic or enter an ID using an expression',
			},
			{
				displayName: 'Update Fields',
				name: 'topicUpdateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['topics'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'New name for the topic',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'New description for the topic',
					},
					{
						displayName: 'Visibility',
						name: 'visibility',
						type: 'options',
						default: 'private',
						options: [
							{ name: 'Private', value: 'private' },
							{ name: 'Public', value: 'public' },
						],
						description: 'Visibility on the unsubscribe page',
					},
				],
			},
			{
				displayName: 'List Options',
				name: 'topicListOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['topics'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 20,
						description: 'Max number of topics to return (1-100)',
					},
					{
						displayName: 'After',
						name: 'after',
						type: 'string',
						default: '',
						description: 'Return results after this topic ID',
					},
					{
						displayName: 'Before',
						name: 'before',
						type: 'string',
						default: '',
						description: 'Return results before this topic ID',
					},
				],
			},

			// CONTACT PROPERTIES
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'contact@example.com',
				displayOptions: {
					show: {
						resource: ['contacts'],
						operation: ['create'],
					},
				},
				description: 'The email address of the contact',
			},
			{
				displayName: 'Contact Identifier',
				name: 'contactIdentifier',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e169aa45-1ecf-4183-9955-b1499d5701d3 or contact@example.com',
				displayOptions: {
					show: {
						resource: ['contacts'],
						operation: ['get', 'delete'],
					},
				},
				description: 'The contact ID or email address',
			},
			{
				displayName: 'Update By',
				name: 'updateBy',
				type: 'options',
				options: [
					{ name: 'Contact ID', value: 'id' },
					{ name: 'Email Address', value: 'email' },
				],
				default: 'id',
				displayOptions: {
					show: {
						resource: ['contacts'],
						operation: ['update'],
					},
				},
				description: 'Choose whether to update the contact by ID or email address',
			},
			{
				displayName: 'Contact ID',
				name: 'contactId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'con_123456',
				displayOptions: {
					show: {
						resource: ['contacts'],
						operation: ['update'],
						updateBy: ['id'],
					},
				},
				description: 'The ID of the contact to update',
			},
			{
				displayName: 'Contact Email',
				name: 'contactEmail',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'contact@example.com',
				displayOptions: {
					show: {
						resource: ['contacts'],
						operation: ['update'],
						updateBy: ['email'],
					},
				},
				description: 'The email address of the contact to update',
			},
			{
				displayName: 'Create Fields',
				name: 'contactCreateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['contacts'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'First Name',
						name: 'first_name',
						type: 'string',
						default: '',
						description: 'The first name of the contact',
					},
					{
						displayName: 'Last Name',
						name: 'last_name',
						type: 'string',
						default: '',
						description: 'The last name of the contact',
					},
					{
						displayName: 'Unsubscribed',
						name: 'unsubscribed',
						type: 'boolean',
						default: false,
						description: 'Whether the contact is unsubscribed from emails',
					},
					{
						displayName: 'Properties',
						name: 'properties',
						type: 'fixedCollection',
						default: { properties: [] },
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'properties',
								displayName: 'Property',
								values: [
									{
										displayName: 'Key',
										name: 'key',
										type: 'string',
										required: true,
										default: '',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
									},
								],
							},
						],
					},
					{
						displayName: 'Segments',
						name: 'segments',
						type: 'fixedCollection',
						default: { segments: [] },
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'segments',
								displayName: 'Segment',
								values: [
									{
										displayName: 'Segment ID',
										name: 'id',
										type: 'string',
										required: true,
										default: '',
									},
								],
							},
						],
					},
					{
						displayName: 'Topics',
						name: 'topics',
						type: 'fixedCollection',
						default: { topics: [] },
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'topics',
								displayName: 'Topic',
								values: [
									{
										displayName: 'Topic ID',
										name: 'id',
										type: 'string',
										required: true,
										default: '',
									},
									{
										displayName: 'Subscription',
										name: 'subscription',
										type: 'options',
										default: 'opt_in',
										options: [
											{ name: 'Opt In', value: 'opt_in' },
											{ name: 'Opt Out', value: 'opt_out' },
										],
									},
								],
							},
						],
					},
				],
			},
			{
				displayName: 'Update Fields',
				name: 'contactUpdateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['contacts'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'First Name',
						name: 'first_name',
						type: 'string',
						default: '',
						description: 'The first name of the contact',
					},
					{
						displayName: 'Last Name',
						name: 'last_name',
						type: 'string',
						default: '',
						description: 'The last name of the contact',
					},
					{
						displayName: 'Unsubscribed',
						name: 'unsubscribed',
						type: 'boolean',
						default: false,
						description: 'Whether the contact is unsubscribed from emails',
					},
					{
						displayName: 'Properties',
						name: 'properties',
						type: 'fixedCollection',
						default: { properties: [] },
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'properties',
								displayName: 'Property',
								values: [
									{
										displayName: 'Key',
										name: 'key',
										type: 'string',
										required: true,
										default: '',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
									},
								],
							},
						],
					},
				],
			},
			{
				displayName: 'List Options',
				name: 'contactListOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['contacts'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 20,
						description: 'Max number of contacts to return (1-100)',
					},
					{
						displayName: 'After',
						name: 'after',
						type: 'string',
						default: '',
						description: 'Return results after this contact ID',
					},
					{
						displayName: 'Before',
						name: 'before',
						type: 'string',
						default: '',
						description: 'Return results before this contact ID',
					},
				],
			},

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
						name: 'Send',
						value: 'send',
						description: 'Send an email using a template',
						action: 'Send a template email',
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

			// BROADCAST OPERATIONS
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['broadcasts'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new broadcast',
						action: 'Create a broadcast',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a broadcast',
						action: 'Delete a broadcast',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a broadcast by ID',
						action: 'Get a broadcast',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all broadcasts',
						action: 'List broadcasts',
					},
					{
						name: 'Send',
						value: 'send',
						description: 'Send a broadcast',
						action: 'Send a broadcast',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a broadcast',
						action: 'Update a broadcast',
					},
				],
				default: 'list',
			},

			// SEGMENT OPERATIONS
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['segments'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new segment',
						action: 'Create a segment',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a segment by ID',
						action: 'Get a segment',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a segment',
						action: 'Delete a segment',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all segments',
						action: 'List segments',
					},
				],
				default: 'list',
			},

			// TOPIC OPERATIONS
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['topics'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new topic',
						action: 'Create a topic',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a topic',
						action: 'Delete a topic',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a topic by ID',
						action: 'Get a topic',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all topics',
						action: 'List topics',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a topic',
						action: 'Update a topic',
					},
				],
				default: 'list',
			},

			// CONTACT OPERATIONS
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
						name: 'Create',
						value: 'create',
						description: 'Create a new contact',
						action: 'Create a contact',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a contact',
						action: 'Delete a contact',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a contact by ID',
						action: 'Get a contact',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List contacts',
						action: 'List contacts',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a contact',
						action: 'Update a contact',
					},
				],
				default: 'list',
			},
		],
	};
	methods = {
		loadOptions: {
			async getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('resendApi');
				const apiKey = credentials.apiKey as string;
				const returnData: INodePropertyOptions[] = [];
				const limit = 100;
				let after: string | undefined;
				let hasMore = true;
				let pageCount = 0;
				const maxPages = 10;

				while (hasMore) {
					const qs: Record<string, string | number> = { limit };
					if (after) {
						qs.after = after;
					}

					const response = await this.helpers.httpRequest({
						url: 'https://api.resend.com/templates',
						method: 'GET',
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						qs,
						json: true,
					});

					const templates = response?.data ?? [];
					for (const template of templates) {
						if (!template?.id) {
							continue;
						}
						const name = template.name ? `${template.name} (${template.id})` : template.id;
						returnData.push({
							name,
							value: template.id,
						});
					}

					hasMore = Boolean(response?.has_more);
					after = templates.length ? templates[templates.length - 1].id : undefined;
					pageCount += 1;
					if (!after || pageCount >= maxPages) {
						break;
					}
				}

				return returnData;
			},
			async getSegments(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('resendApi');
				const apiKey = credentials.apiKey as string;
				const returnData: INodePropertyOptions[] = [];
				const limit = 100;
				let after: string | undefined;
				let hasMore = true;
				let pageCount = 0;
				const maxPages = 10;

				while (hasMore) {
					const qs: Record<string, string | number> = { limit };
					if (after) {
						qs.after = after;
					}

					const response = await this.helpers.httpRequest({
						url: 'https://api.resend.com/segments',
						method: 'GET',
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						qs,
						json: true,
					});

					const segments = response?.data ?? [];
					for (const segment of segments) {
						if (!segment?.id) {
							continue;
						}
						const name = segment.name ? `${segment.name} (${segment.id})` : segment.id;
						returnData.push({
							name,
							value: segment.id,
						});
					}

					hasMore = Boolean(response?.has_more);
					after = segments.length ? segments[segments.length - 1].id : undefined;
					pageCount += 1;
					if (!after || pageCount >= maxPages) {
						break;
					}
				}

				return returnData;
			},
			async getTopics(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('resendApi');
				const apiKey = credentials.apiKey as string;
				const returnData: INodePropertyOptions[] = [];
				const limit = 100;
				let after: string | undefined;
				let hasMore = true;
				let pageCount = 0;
				const maxPages = 10;

				while (hasMore) {
					const qs: Record<string, string | number> = { limit };
					if (after) {
						qs.after = after;
					}

					const response = await this.helpers.httpRequest({
						url: 'https://api.resend.com/topics',
						method: 'GET',
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						qs,
						json: true,
					});

					const topics = response?.data ?? [];
					for (const topic of topics) {
						if (!topic?.id) {
							continue;
						}
						const name = topic.name ? `${topic.name} (${topic.id})` : topic.id;
						returnData.push({
							name,
							value: topic.id,
						});
					}

					hasMore = Boolean(response?.has_more);
					after = topics.length ? topics[topics.length - 1].id : undefined;
					pageCount += 1;
					if (!after || pageCount >= maxPages) {
						break;
					}
				}

				return returnData;
			},
		},
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		const parseTemplateVariables = (
			variablesInput: { variables?: Array<{ key: string; type: string; fallbackValue?: unknown }> } | undefined,
			fallbackKey: 'fallbackValue' | 'fallback_value',
			itemIndex: number,
		) => {
			if (!variablesInput?.variables?.length) {
				return undefined;
			}

			return variablesInput.variables.map((variable) => {
				const variableEntry: Record<string, unknown> = {
					key: variable.key,
					type: variable.type,
				};

				const fallbackValue = variable.fallbackValue;
				if (fallbackValue !== undefined && fallbackValue !== '') {
					let parsedFallback: string | number = fallbackValue as string;
					if (variable.type === 'number') {
						const numericFallback = typeof fallbackValue === 'number' ? fallbackValue : Number(fallbackValue);
						if (Number.isNaN(numericFallback)) {
							throw new NodeOperationError(
								this.getNode(),
								`Variable "${variable.key}" fallback value must be a number`,
								{ itemIndex },
							);
						}
						parsedFallback = numericFallback;
					}
					variableEntry[fallbackKey] = parsedFallback;
				}

				return variableEntry;
			});
		};
		const buildTemplateSendVariables = (
			variablesInput: { variables?: Array<{ key: string; value?: unknown }> } | undefined,
		) => {
			if (!variablesInput?.variables?.length) {
				return undefined;
			}

			const variables: Record<string, unknown> = {};
			for (const variable of variablesInput.variables) {
				if (variable.key) {
					variables[variable.key] = variable.value ?? '';
				}
			}

			return Object.keys(variables).length ? variables : undefined;
		};

		for (let i = 0; i < length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const credentials = await this.getCredentials('resendApi');
				const apiKey = credentials.apiKey as string;

				let response: any;

				// EMAIL OPERATIONS
				if (resource === 'email') {
					if (operation === 'send') {
						const from = this.getNodeParameter('from', i) as string;
						const to = this.getNodeParameter('to', i) as string;
						const subject = this.getNodeParameter('subject', i) as string;
						const emailFormat = this.getNodeParameter('emailFormat', i) as string;
						const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as any;

						const requestBody: any = {
							from,
							to: to.split(',').map((email: string) => email.trim()).filter((email: string) => email),
							subject,
						};

						// Add content based on selected format
						if (emailFormat === 'html' || emailFormat === 'both') {
							const html = this.getNodeParameter('html', i) as string;
							if (!html) {
								throw new NodeOperationError(this.getNode(), 'HTML Content is required.', { itemIndex: i });
							}
							requestBody.html = html;
						}
						if (emailFormat === 'text' || emailFormat === 'both') {
							const text = this.getNodeParameter('text', i) as string;
							if (!text) {
								throw new NodeOperationError(this.getNode(), 'Text Content is required.', { itemIndex: i });
							}
							requestBody.text = text;
						}
						if (additionalOptions.cc) {
							requestBody.cc = additionalOptions.cc
								.split(',')
								.map((email: string) => email.trim())
								.filter((email: string) => email);
						}
						if (additionalOptions.bcc) {
							requestBody.bcc = additionalOptions.bcc
								.split(',')
								.map((email: string) => email.trim())
								.filter((email: string) => email);
						}
						if (additionalOptions.reply_to) {
							if (Array.isArray(additionalOptions.reply_to)) {
								requestBody.reply_to = additionalOptions.reply_to;
							} else if (
								typeof additionalOptions.reply_to === 'string' &&
								additionalOptions.reply_to.includes(',')
							) {
								requestBody.reply_to = additionalOptions.reply_to
									.split(',')
									.map((email: string) => email.trim())
									.filter((email: string) => email);
							} else {
								requestBody.reply_to = additionalOptions.reply_to;
							}
						}
						if (additionalOptions.headers?.headers?.length) {
							const headers: Record<string, string> = {};
							for (const header of additionalOptions.headers.headers) {
								if (header.name) {
									headers[header.name] = header.value ?? '';
								}
							}
							if (Object.keys(headers).length) {
								requestBody.headers = headers;
							}
						}
						if (additionalOptions.tags?.tags?.length) {
							requestBody.tags = additionalOptions.tags.tags
								.filter((tag: { name?: string }) => tag.name)
								.map((tag: { name: string; value?: string }) => ({
									name: tag.name,
									value: tag.value ?? '',
								}));
						}
						if (additionalOptions.topic_id) requestBody.topic_id = additionalOptions.topic_id;
						if (additionalOptions.scheduled_at) requestBody.scheduled_at = additionalOptions.scheduled_at;
						
						// Validate that attachments aren't used with scheduled emails
						if (additionalOptions.attachments && additionalOptions.attachments.attachments && additionalOptions.attachments.attachments.length > 0 && additionalOptions.scheduled_at) {
							throw new NodeOperationError(this.getNode(), 'Attachments cannot be used with scheduled emails. Please remove either the attachments or the scheduled time.', { itemIndex: i });
						}

						// Handle attachments
						if (additionalOptions.attachments && additionalOptions.attachments.attachments && additionalOptions.attachments.attachments.length > 0) {
							requestBody.attachments = additionalOptions.attachments.attachments.map((attachment: any) => {
								if (attachment.attachmentType === 'binaryData') {
									// Get binary data from the current item
									const binaryPropertyName = attachment.binaryPropertyName || 'data';
									const binaryData = items[i].binary?.[binaryPropertyName];
											if (!binaryData) {
										throw new NodeOperationError(this.getNode(), `Binary property "${binaryPropertyName}" not found in item ${i}`, { itemIndex: i });
									}
									
									return {
										filename: attachment.filename,
										content: binaryData.data, // This should be base64 content
									};
								} else if (attachment.attachmentType === 'url') {
									return {
										filename: attachment.filename,
										path: attachment.fileUrl,
									};
								}
								return null;
							}).filter((attachment: any) => attachment !== null);
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/emails',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					} else if (operation === 'sendBatch') {
						const emailsData = this.getNodeParameter('emails', i) as any;
						const emailFormat = this.getNodeParameter('emailFormat', i) as string;

						const emails = emailsData.emails.map((email: any) => {
							const emailObj: any = {
								from: email.from,
								to: email.to.split(',').map((e: string) => e.trim()).filter((e: string) => e),
								subject: email.subject,
							};

							if (emailFormat === 'html' || emailFormat === 'both') {
								if (!email.html) {
									throw new NodeOperationError(this.getNode(), 'HTML Content is required for batch emails.', { itemIndex: i });
								}
								emailObj.html = email.html;
							}

							if (emailFormat === 'text' || emailFormat === 'both') {
								if (!email.text) {
									throw new NodeOperationError(this.getNode(), 'Text Content is required for batch emails.', { itemIndex: i });
								}
								emailObj.text = email.text;
							}

							return emailObj;
						});

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/emails/batch',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: emails,
							json: true,
						});

					} else if (operation === 'list') {
						const listOptions = this.getNodeParameter('emailListOptions', i, {}) as any;
						const qs: Record<string, string | number> = {};

						if (listOptions.after && listOptions.before) {
							throw new NodeOperationError(
								this.getNode(),
								'You can only use either "After" or "Before", not both.',
								{ itemIndex: i },
							);
						}

						if (listOptions.limit !== undefined) {
							qs.limit = listOptions.limit;
						}
						if (listOptions.after) {
							qs.after = listOptions.after;
						}
						if (listOptions.before) {
							qs.before = listOptions.before;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/emails',
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							qs,
							json: true,
						});

					} else if (operation === 'retrieve') {
						const emailId = this.getNodeParameter('emailId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/emails/${emailId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'update') {
						const emailId = this.getNodeParameter('emailId', i) as string;
						const scheduledAt = this.getNodeParameter('scheduled_at', i) as string;

						const requestBody: any = {};
						if (scheduledAt) requestBody.scheduled_at = scheduledAt;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/emails/${emailId}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'cancel') {
						const emailId = this.getNodeParameter('emailId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/emails/${emailId}/cancel`,
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {},
							json: true,
						});
					}

					// TEMPLATE OPERATIONS
				} else if (resource === 'templates') {
					if (operation === 'create') {
						const templateName = this.getNodeParameter('templateName', i) as string;
						const templateFrom = this.getNodeParameter('templateFrom', i) as string;
						const templateSubject = this.getNodeParameter('templateSubject', i) as string;
						const templateHtml = this.getNodeParameter('templateHtml', i) as string;
						const templateVariables = this.getNodeParameter('templateVariables', i, {}) as any;

						const requestBody: any = {
							name: templateName,
							from: templateFrom,
							subject: templateSubject,
							html: templateHtml,
						};

						const variables = parseTemplateVariables(templateVariables, 'fallbackValue', i);
						if (variables?.length) {
							requestBody.variables = variables;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/templates',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					} else if (operation === 'get') {
						const templateId = this.getNodeParameter('templateId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/templates/${templateId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'list') {
						const listOptions = this.getNodeParameter('templateListOptions', i, {}) as any;
						const qs: Record<string, string | number> = {};

						if (listOptions.after && listOptions.before) {
							throw new NodeOperationError(
								this.getNode(),
								'You can only use either "After" or "Before", not both.',
								{ itemIndex: i },
							);
						}

						if (listOptions.limit !== undefined) {
							qs.limit = listOptions.limit;
						}
						if (listOptions.after) {
							qs.after = listOptions.after;
						}
						if (listOptions.before) {
							qs.before = listOptions.before;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/templates',
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							qs,
							json: true,
						});
					} else if (operation === 'update') {
						const templateId = this.getNodeParameter('templateId', i) as string;
						const updateFields = this.getNodeParameter('templateUpdateFields', i, {}) as any;
						const templateVariables = this.getNodeParameter('templateVariables', i, {}) as any;

						const requestBody: any = {};

						if (updateFields.alias) requestBody.alias = updateFields.alias;
						if (updateFields.from) requestBody.from = updateFields.from;
						if (updateFields.html) requestBody.html = updateFields.html;
						if (updateFields.name) requestBody.name = updateFields.name;
						if (updateFields.reply_to) {
							if (Array.isArray(updateFields.reply_to)) {
								requestBody.reply_to = updateFields.reply_to;
							} else if (
								typeof updateFields.reply_to === 'string' &&
								updateFields.reply_to.includes(',')
							) {
								requestBody.reply_to = updateFields.reply_to
									.split(',')
									.map((email: string) => email.trim())
									.filter((email: string) => email);
							} else {
								requestBody.reply_to = updateFields.reply_to;
							}
						}
						if (updateFields.subject) requestBody.subject = updateFields.subject;
						if (Object.prototype.hasOwnProperty.call(updateFields, 'text')) {
							requestBody.text = updateFields.text;
						}

						const variables = parseTemplateVariables(templateVariables, 'fallback_value', i);
						if (variables?.length) {
							requestBody.variables = variables;
						}

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/templates/${templateId}`,
							method: 'PUT',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					} else if (operation === 'delete') {
						const templateId = this.getNodeParameter('templateId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/templates/${templateId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'send') {
						const templateId = this.getNodeParameter('templateId', i) as string;
						const templateFrom = this.getNodeParameter('templateSendFrom', i) as string;
						const templateTo = this.getNodeParameter('templateSendTo', i) as string | string[];
						const templateSendVariables = this.getNodeParameter('templateSendVariables', i, {}) as any;

						const requestBody: any = {
							from: templateFrom,
							to: Array.isArray(templateTo)
								? templateTo
								: templateTo
										.split(',')
										.map((email: string) => email.trim())
										.filter((email: string) => email),
							template: {
								id: templateId,
							},
						};

						const variables = buildTemplateSendVariables(templateSendVariables);
						if (variables && Object.keys(variables).length) {
							requestBody.template.variables = variables;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/emails',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					}

					// DOMAIN OPERATIONS
				} else if (resource === 'domains') {
					if (operation === 'create') {
						const domainName = this.getNodeParameter('domainName', i) as string;
						const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as any;

						const requestBody: any = { name: domainName };
						if (additionalOptions.region) requestBody.region = additionalOptions.region;
						if (additionalOptions.custom_return_path) requestBody.custom_return_path = additionalOptions.custom_return_path;

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/domains',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'get') {
						const domainId = this.getNodeParameter('domainId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/domains/${domainId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'verify') {
						const domainId = this.getNodeParameter('domainId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/domains/${domainId}/verify`,
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {},
							json: true,
						});
					} else if (operation === 'update') {
						const domainId = this.getNodeParameter('domainId', i) as string;
						const domainUpdateOptions = this.getNodeParameter('domainUpdateOptions', i, {}) as any;

						const requestBody: any = {};
						if (domainUpdateOptions.click_tracking !== undefined) requestBody.click_tracking = domainUpdateOptions.click_tracking;
						if (domainUpdateOptions.open_tracking !== undefined) requestBody.open_tracking = domainUpdateOptions.open_tracking;
						if (domainUpdateOptions.tls) requestBody.tls = domainUpdateOptions.tls;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/domains/${domainId}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'list') {
						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/domains',
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'delete') {
						const domainId = this.getNodeParameter('domainId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/domains/${domainId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// API KEY OPERATIONS
				} else if (resource === 'apiKeys') {
					if (operation === 'create') {
						const apiKeyName = this.getNodeParameter('apiKeyName', i) as string;
						const permission = this.getNodeParameter('permission', i) as string;
						const domainId = this.getNodeParameter('domainId', i, '') as string;

						const requestBody: any = {
							name: apiKeyName,
							permission,
						};

						if (permission === 'sending_access' && domainId) {
							requestBody.domain_id = domainId;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/api-keys',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'list') {
						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/api-keys',
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'delete') {
						const apiKeyId = this.getNodeParameter('apiKeyId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/api-keys/${apiKeyId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// BROADCAST OPERATIONS
				} else if (resource === 'broadcasts') {
					if (operation === 'create') {
						const segmentId = this.getNodeParameter('segmentId', i) as string;
						const broadcastFrom = this.getNodeParameter('broadcastFrom', i) as string;
						const broadcastSubject = this.getNodeParameter('broadcastSubject', i) as string;
						const broadcastHtml = this.getNodeParameter('broadcastHtml', i) as string;
						const createOptions = this.getNodeParameter('broadcastCreateOptions', i, {}) as any;

						const requestBody: any = {
							segment_id: segmentId,
							from: broadcastFrom,
							subject: broadcastSubject,
							html: broadcastHtml,
						};

						if (createOptions.name) requestBody.name = createOptions.name;
						if (createOptions.reply_to) {
							if (Array.isArray(createOptions.reply_to)) {
								requestBody.reply_to = createOptions.reply_to;
							} else if (
								typeof createOptions.reply_to === 'string' &&
								createOptions.reply_to.includes(',')
							) {
								requestBody.reply_to = createOptions.reply_to
									.split(',')
									.map((email: string) => email.trim())
									.filter((email: string) => email);
							} else {
								requestBody.reply_to = createOptions.reply_to;
							}
						}
						if (Object.prototype.hasOwnProperty.call(createOptions, 'text')) {
							requestBody.text = createOptions.text;
						}
						if (createOptions.topic_id) requestBody.topic_id = createOptions.topic_id;

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/broadcasts',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'get') {
						const broadcastId = this.getNodeParameter('broadcastId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/broadcasts/${broadcastId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'update') {
						const broadcastId = this.getNodeParameter('broadcastId', i) as string;
						const updateFields = this.getNodeParameter('broadcastUpdateFields', i, {}) as any;

						const requestBody: any = {};
						if (updateFields.segment_id) requestBody.segment_id = updateFields.segment_id;
						if (updateFields.from) requestBody.from = updateFields.from;
						if (updateFields.subject) requestBody.subject = updateFields.subject;
						if (updateFields.html) requestBody.html = updateFields.html;
						if (Object.prototype.hasOwnProperty.call(updateFields, 'text')) {
							requestBody.text = updateFields.text;
						}
						if (updateFields.reply_to) {
							if (Array.isArray(updateFields.reply_to)) {
								requestBody.reply_to = updateFields.reply_to;
							} else if (
								typeof updateFields.reply_to === 'string' &&
								updateFields.reply_to.includes(',')
							) {
								requestBody.reply_to = updateFields.reply_to
									.split(',')
									.map((email: string) => email.trim())
									.filter((email: string) => email);
							} else {
								requestBody.reply_to = updateFields.reply_to;
							}
						}
						if (updateFields.name) requestBody.name = updateFields.name;
						if (updateFields.topic_id) requestBody.topic_id = updateFields.topic_id;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/broadcasts/${broadcastId}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'send') {
						const broadcastId = this.getNodeParameter('broadcastId', i) as string;
						const sendOptions = this.getNodeParameter('broadcastSendOptions', i, {}) as any;
						const requestBody: any = {};

						if (sendOptions.scheduled_at) {
							requestBody.scheduled_at = sendOptions.scheduled_at;
						}

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/broadcasts/${broadcastId}/send`,
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'list') {
						const listOptions = this.getNodeParameter('broadcastListOptions', i, {}) as any;
						const qs: Record<string, string | number> = {};

						if (listOptions.after && listOptions.before) {
							throw new NodeOperationError(
								this.getNode(),
								'You can only use either "After" or "Before", not both.',
								{ itemIndex: i },
							);
						}

						if (listOptions.limit !== undefined) {
							qs.limit = listOptions.limit;
						}
						if (listOptions.after) {
							qs.after = listOptions.after;
						}
						if (listOptions.before) {
							qs.before = listOptions.before;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/broadcasts',
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							qs,
							json: true,
						});

					} else if (operation === 'delete') {
						const broadcastId = this.getNodeParameter('broadcastId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/broadcasts/${broadcastId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// SEGMENT OPERATIONS
				} else if (resource === 'segments') {
					if (operation === 'create') {
						const segmentName = this.getNodeParameter('segmentName', i) as string;

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/segments',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {
								name: segmentName,
							},
							json: true,
						});

					} else if (operation === 'get') {
						const segmentId = this.getNodeParameter('segmentId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/segments/${segmentId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'list') {
						const listOptions = this.getNodeParameter('segmentListOptions', i, {}) as any;
						const qs: Record<string, string | number> = {};

						if (listOptions.after && listOptions.before) {
							throw new NodeOperationError(
								this.getNode(),
								'You can only use either "After" or "Before", not both.',
								{ itemIndex: i },
							);
						}

						if (listOptions.limit !== undefined) {
							qs.limit = listOptions.limit;
						}
						if (listOptions.after) {
							qs.after = listOptions.after;
						}
						if (listOptions.before) {
							qs.before = listOptions.before;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/segments',
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							qs,
							json: true,
						});

					} else if (operation === 'delete') {
						const segmentId = this.getNodeParameter('segmentId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/segments/${segmentId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// TOPIC OPERATIONS
				} else if (resource === 'topics') {
					if (operation === 'create') {
						const topicName = this.getNodeParameter('topicName', i) as string;
						const defaultSubscription = this.getNodeParameter('topicDefaultSubscription', i) as string;
						const createOptions = this.getNodeParameter('topicCreateOptions', i, {}) as any;

						const requestBody: any = {
							name: topicName,
							default_subscription: defaultSubscription,
						};

						if (Object.prototype.hasOwnProperty.call(createOptions, 'description')) {
							requestBody.description = createOptions.description;
						}
						if (createOptions.visibility) requestBody.visibility = createOptions.visibility;

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/topics',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'get') {
						const topicId = this.getNodeParameter('topicId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/topics/${topicId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'list') {
						const listOptions = this.getNodeParameter('topicListOptions', i, {}) as any;
						const qs: Record<string, string | number> = {};

						if (listOptions.after && listOptions.before) {
							throw new NodeOperationError(
								this.getNode(),
								'You can only use either "After" or "Before", not both.',
								{ itemIndex: i },
							);
						}

						if (listOptions.limit !== undefined) {
							qs.limit = listOptions.limit;
						}
						if (listOptions.after) {
							qs.after = listOptions.after;
						}
						if (listOptions.before) {
							qs.before = listOptions.before;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/topics',
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							qs,
							json: true,
						});

					} else if (operation === 'update') {
						const topicId = this.getNodeParameter('topicId', i) as string;
						const updateFields = this.getNodeParameter('topicUpdateFields', i, {}) as any;

						const requestBody: any = {};

						if (updateFields.name) requestBody.name = updateFields.name;
						if (Object.prototype.hasOwnProperty.call(updateFields, 'description')) {
							requestBody.description = updateFields.description;
						}
						if (updateFields.visibility) requestBody.visibility = updateFields.visibility;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/topics/${topicId}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'delete') {
						const topicId = this.getNodeParameter('topicId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/topics/${topicId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// CONTACT OPERATIONS
				} else if (resource === 'contacts') {
					if (operation === 'create') {
						const email = this.getNodeParameter('email', i) as string;
						const createFields = this.getNodeParameter('contactCreateFields', i, {}) as any;
						const requestBody: any = {
							email,
						};

						if (createFields.first_name) requestBody.first_name = createFields.first_name;
						if (createFields.last_name) requestBody.last_name = createFields.last_name;
						if (createFields.unsubscribed !== undefined) requestBody.unsubscribed = createFields.unsubscribed;

						if (createFields.properties?.properties?.length) {
							const properties: Record<string, string> = {};
							for (const property of createFields.properties.properties) {
								if (property.key) {
									properties[property.key] = property.value ?? '';
								}
							}
							if (Object.keys(properties).length) {
								requestBody.properties = properties;
							}
						}

						if (createFields.segments?.segments?.length) {
							requestBody.segments = createFields.segments.segments
								.filter((segment: { id?: string }) => segment.id)
								.map((segment: { id: string }) => ({ id: segment.id }));
						}

						if (createFields.topics?.topics?.length) {
							requestBody.topics = createFields.topics.topics
								.filter((topic: { id?: string }) => topic.id)
								.map((topic: { id: string; subscription?: string }) => ({
									id: topic.id,
									subscription: topic.subscription || 'opt_in',
								}));
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/contacts',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'get') {
						const contactIdentifier = this.getNodeParameter('contactIdentifier', i) as string;
						const encodedIdentifier = encodeURIComponent(contactIdentifier);

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/contacts/${encodedIdentifier}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'update') {
						const updateBy = this.getNodeParameter('updateBy', i) as string;
						const updateFields = this.getNodeParameter('contactUpdateFields', i, {}) as any;

						const requestBody: any = {};

						if (updateBy === 'id') {
							requestBody.id = this.getNodeParameter('contactId', i) as string;
						} else {
							requestBody.email = this.getNodeParameter('contactEmail', i) as string;
						}

						if (updateFields.first_name) requestBody.first_name = updateFields.first_name;
						if (updateFields.last_name) requestBody.last_name = updateFields.last_name;
						if (updateFields.unsubscribed !== undefined) requestBody.unsubscribed = updateFields.unsubscribed;

						if (updateFields.properties?.properties?.length) {
							const properties: Record<string, string> = {};
							for (const property of updateFields.properties.properties) {
								if (property.key) {
									properties[property.key] = property.value ?? '';
								}
							}
							if (Object.keys(properties).length) {
								requestBody.properties = properties;
							}
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/contacts',
							method: 'PUT',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'list') {
						const listOptions = this.getNodeParameter('contactListOptions', i, {}) as any;
						const qs: Record<string, string | number> = {};

						if (listOptions.after && listOptions.before) {
							throw new NodeOperationError(
								this.getNode(),
								'You can only use either "After" or "Before", not both.',
								{ itemIndex: i },
							);
						}

						if (listOptions.limit !== undefined) {
							qs.limit = listOptions.limit;
						}
						if (listOptions.after) {
							qs.after = listOptions.after;
						}
						if (listOptions.before) {
							qs.before = listOptions.before;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/contacts',
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							qs,
							json: true,
						});

					} else if (operation === 'delete') {
						const contactIdentifier = this.getNodeParameter('contactIdentifier', i) as string;
						const encodedIdentifier = encodeURIComponent(contactIdentifier);

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/contacts/${encodedIdentifier}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}
				}

				returnData.push({ json: response, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error);
			}
		}
		return [returnData];
	}
}
