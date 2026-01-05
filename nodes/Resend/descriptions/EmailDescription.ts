import {
	INodeProperties,
} from 'n8n-workflow';

export const emailOperations: INodeProperties[] = [
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
	},
];

export const emailFields: INodeProperties[] = [
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
	},
	{
		displayName: 'Use Template',
		name: 'useTemplate',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
			},
		},
		description: 'Whether to send using a published template instead of HTML/Text content',
	},
	{
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
				operation: ['send'],
				useTemplate: [false],
			},
		},
		description: 'Choose the format for your email content. HTML allows rich formatting, text is simple and universally compatible.',
	},
	{
		displayName: 'Template Name or ID',
		name: 'emailTemplateId',
		type: 'options',
		required: true,
		default: '',
		placeholder: '34a080c9-b17d-4187-ad80-5af20266e535',
		typeOptions: {
			loadOptionsMethod: 'getTemplates',
		},
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
				useTemplate: [true],
			},
		},
		description: 'Select a template or enter an ID/alias using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Template Variables',
		name: 'emailTemplateVariables',
		type: 'fixedCollection',
		default: { variables: [] },
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['send'],
				useTemplate: [true],
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
						type: 'options',
						required: true,
						default: '',
						typeOptions: {
							loadOptionsMethod: 'getTemplateVariables',
							loadOptionsDependsOn: ['emailTemplateId'],
							allowCustomValues: true,
						},
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
	{
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
				useTemplate: [false],
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
				useTemplate: [false],
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
				description: 'Email attachments (not supported with scheduled emails)',
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
								displayName: 'Content ID',
								name: 'content_id',
								type: 'string',
								default: '',
								placeholder: 'image-1',
								description: 'Content ID for embedding inline attachments via cid:',
							},
							{
								displayName: 'Content Type',
								name: 'content_type',
								type: 'string',
								default: '',
								placeholder: 'image/png',
								description: 'Content type for the attachment',
							},
							{
								displayName: 'File Name',
								name: 'filename',
								type: 'string',
								default: '',
								placeholder: 'document.pdf',
								description: 'Name for the attached file (required for both binary data and URL)',
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
				displayName: 'Reply To',
				name: 'reply_to',
				type: 'string',
				default: '',
				description: 'Reply-to email address. For multiple addresses, use comma-separated values.',
			},
			{
				displayName: 'Scheduled At',
				name: 'scheduled_at',
				type: 'string',
				default: '',
				description: 'Schedule email to be sent later (e.g., "in 1 min" or ISO 8601 format)',
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
		description: 'Array of emails to send (max 100)',
		options: [
			{
				name: 'emails',
				displayName: 'Email',
				values: [
					{
						displayName: 'Attachments',
						name: 'attachments',
						type: 'fixedCollection',
						default: { attachments: [] },
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'attachments',
								displayName: 'Attachment',
								values: [
									{
										displayName: 'Binary Property',
										name: 'binaryPropertyName',
										type: 'string',
										default: 'data',
										placeholder: 'data',
										description: 'Name of the binary property which contains the file data',
									},
									{
										displayName: 'Content ID',
										name: 'content_id',
										type: 'string',
										default: '',
										placeholder: 'image-1',
										description: 'Content ID for embedding inline attachments via cid:',
									},
									{
										displayName: 'Content Type',
										name: 'content_type',
										type: 'string',
										default: '',
										placeholder: 'application/pdf',
										description: 'Content type for the attachment',
									},
									{
										displayName: 'File Name',
										name: 'filename',
										type: 'string',
										default: '',
										placeholder: 'document.pdf',
										description: 'Name for the attached file',
									},
								],
							},
						],
						description: 'Attachments for this email (binary data only)',
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
						displayName: 'Content Type',
						name: 'contentType',
						type: 'options',
						default: 'html',
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
							{
								name: 'Template',
								value: 'template',
								description: 'Send email using a template',
							},
						],
						description: 'Choose how to provide content for this email',
					},
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
						displayName: 'HTML Content',
						name: 'html',
						type: 'string',
						default: '',
						description: 'HTML content of the email',
						placeholder: '<p>Your HTML content here</p>',
						typeOptions: {
							rows: 4,
						},
						displayOptions: {
							show: {
								contentType: ['html', 'both'],
							},
						},
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
						required: true,
						default: '',
						placeholder: 'Hello from n8n!',
						description: 'Email subject',
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
								contentType: ['template'],
							},
						},
						description: 'Select a template or enter an ID/alias using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
								contentType: ['template'],
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
										type: 'options',
										required: true,
										default: '',
										typeOptions: {
											loadOptionsMethod: 'getTemplateVariables',
											loadOptionsDependsOn: ['templateId'],
											allowCustomValues: true,
										},
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
					{
						displayName: 'Text Content',
						name: 'text',
						type: 'string',
						default: '',
						description: 'Plain text content of the email',
						typeOptions: {
							rows: 4,
						},
						placeholder: 'Your plain text content here',
						displayOptions: {
							show: {
								contentType: ['text', 'both'],
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
					{
						displayName: 'Topic ID',
						name: 'topic_id',
						type: 'string',
						default: '',
						description: 'Topic ID to scope the email to',
					},
				],
			},
		],
	},
	{
		displayName: 'Batch Options',
		name: 'batchOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['email'],
				operation: ['sendBatch'],
			},
		},
		options: [
			{
				displayName: 'Idempotency Key',
				name: 'idempotency_key',
				type: 'string',
				default: '',
				description: 'Unique key to ensure the batch request is processed only once',
			},
			{
				displayName: 'Validation Mode',
				name: 'validation_mode',
				type: 'options',
				default: 'strict',
				options: [
					{
						name: 'Strict',
						value: 'strict',
						description: 'Reject the entire batch if any email fails validation',
					},
					{
						name: 'Permissive',
						value: 'permissive',
						description: 'Send valid emails and return errors for invalid ones',
					},
				],
				description: 'How Resend should validate the batch',
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
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
				show: {
					resource: ['email', 'templates', 'domains', 'apiKeys', 'broadcasts', 'segments', 'topics', 'contacts', 'webhooks', 'contactProperties'],
					operation: ['list'],
				},
			},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		displayOptions: {
				show: {
					resource: ['email', 'templates', 'domains', 'apiKeys', 'broadcasts', 'segments', 'topics', 'contacts', 'webhooks', 'contactProperties'],
					operation: ['list'],
					returnAll: [false],
				},
		},
		description: 'Max number of results to return',
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
];
