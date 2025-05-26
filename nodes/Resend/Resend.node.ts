import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

export class Resend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Resend',
		name: 'resend',
		icon: 'file:Resend.svg',
		group: ['output'],
		version: 1,
		description: 'Interact with Resend API for emails, domains, API keys, broadcasts, audiences, and contacts',
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
				noDataExpression: true,				options: [
					{
						name: 'API Key',
						value: 'apiKeys',
						description: 'Manage API keys',
					},
					{
						name: 'Audience',
						value: 'audiences',
						description: 'Manage email audiences',
					},
					{
						name: 'Broadcast',
						value: 'broadcasts',
						description: 'Manage email broadcasts',
					},
					{
						name: 'Contact',
						value: 'contacts',
						description: 'Manage audience contacts',
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
				},				options: [
					{
						name: 'Cancel',
						value: 'cancel',
						description: 'Cancel a scheduled email',
						action: 'Cancel an email',
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
			},			{
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
			},			{
				displayName: 'HTML Content',
				name: 'html',
				type: 'string',
				default: '',
				typeOptions: {
					multiline: true,
				},
				placeholder: '<p>Your HTML content here</p>',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['send'],
						emailFormat: ['html'],
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
				},
				placeholder: 'Your plain text content here',
				displayOptions: {
					show: {
						resource: ['email'],
						operation: ['send'],
						emailFormat: ['text'],
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
				},
				options: [
					{
						displayName: 'CC',
						name: 'cc',
						type: 'string',
						default: '',
						description: 'CC recipient email addresses (comma-separated)',
					},
					{
						displayName: 'BCC',
						name: 'bcc',
						type: 'string',
						default: '',
						description: 'BCC recipient email addresses (comma-separated)',
					},
					{
						displayName: 'Reply To',
						name: 'reply_to',
						type: 'string',
						default: '',
						description: 'Reply-to email address',
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
				description: 'Array of emails to send (max 100)',				options: [					{
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
								displayOptions: {
									show: {
										'/emailFormat': ['html'],
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
								displayOptions: {
									show: {
										'/emailFormat': ['text'],
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
				displayName: 'Broadcast Name',
				name: 'broadcastName',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'My Newsletter',
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['create'],
					},
				},
				description: 'The name of the broadcast',
			},
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
				displayName: 'Audience ID',
				name: 'audienceId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'aud_123456',
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['create'],
					},
				},
				description: 'The ID of the audience for this broadcast',
			},
			{
				displayName: 'Broadcast Content',
				name: 'broadcastContent',
				type: 'collection',
				placeholder: 'Add Content',
				default: {},
				displayOptions: {
					show: {
						resource: ['broadcasts'],
						operation: ['create', 'update'],
					},
				},				options: [
					{
						displayName: 'Audience ID',
						name: 'audience_id',
						type: 'string',
						default: '',
						placeholder: 'aud_123456',
						displayOptions: {
							show: {
								'/operation': ['update'],							},
						},
						description: 'The ID of the audience you want to send to (for update operation)',
					},
					{
						displayName: 'From',
						name: 'from',
						type: 'string',
						default: '',
						placeholder: 'you@example.com',
						description: 'Sender email address. To include a friendly name, use the format &quot;Your Name &lt;sender@domain.com&gt;&quot;.',
					},
					{
						displayName: 'HTML Content',
						name: 'html',
						type: 'string',
						default: '',
						typeOptions: {
							multiline: true,
						},
						placeholder: '<p>Your HTML content here with {{{FIRST_NAME|there}}} and {{{RESEND_UNSUBSCRIBE_URL}}}</p>',
						description: 'The HTML version of the message. You can use variables like {{{FIRST_NAME|fallback}}} and {{{RESEND_UNSUBSCRIBE_URL}}}.',
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
						displayName: 'Reply To',
						name: 'reply_to',
						type: 'string',
						default: '',
						placeholder: 'noreply@example.com',
						description: 'Reply-to email address. For multiple addresses, use comma-separated values.',
					},
					{
						displayName: 'Subject',
						name: 'subject',
						type: 'string',						default: '',
						placeholder: 'Newsletter Subject',
						description: 'Email subject',
					},
					{
						displayName: 'Text Content',
						name: 'text',
						type: 'string',
						default: '',
						typeOptions: {
							multiline: true,						},
						placeholder: 'Your plain text content here',
						description: 'The plain text version of the message',
					},
				],
			},

			// AUDIENCE PROPERTIES
			{
				displayName: 'Audience Name',
				name: 'audienceName',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'Newsletter Subscribers',
				displayOptions: {
					show: {
						resource: ['audiences'],
						operation: ['create'],
					},
				},
				description: 'The name of the audience',
			},
			{
				displayName: 'Audience ID',
				name: 'audienceId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'aud_123456',
				displayOptions: {
					show: {
						resource: ['audiences'],
						operation: ['get', 'delete'],
					},
				},
				description: 'The ID of the audience',
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
						operation: ['get', 'delete'],
					},
				},
				description: 'The ID of the contact',
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
				displayName: 'Audience ID',
				name: 'audienceId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'aud_123456',
				displayOptions: {
					show: {
						resource: ['contacts'],
						operation: ['create', 'list', 'update'],
					},
				},
				description: 'The ID of the audience',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['contacts'],
						operation: ['create', 'update'],
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
				],
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

			// AUDIENCE OPERATIONS
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['audiences'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new audience',
						action: 'Create an audience',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an audience',
						action: 'Delete an audience',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an audience by ID',
						action: 'Get an audience',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all audiences',
						action: 'List audiences',
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
						description: 'List contacts in an audience',
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
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;

		for (let i = 0; i < length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const credentials = await this.getCredentials('resendApi');
				const apiKey = credentials.apiKey as string;

				let response: any;

				// EMAIL OPERATIONS
				if (resource === 'email') {					if (operation === 'send') {
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
						if (emailFormat === 'html') {
							const html = this.getNodeParameter('html', i) as string;
							if (html) requestBody.html = html;
						} else if (emailFormat === 'text') {
							const text = this.getNodeParameter('text', i) as string;
							if (text) requestBody.text = text;
						}
						if (additionalOptions.cc) {
							requestBody.cc = additionalOptions.cc.split(',').map((email: string) => email.trim());
						}
						if (additionalOptions.bcc) {
							requestBody.bcc = additionalOptions.bcc.split(',').map((email: string) => email.trim());
						}
						if (additionalOptions.reply_to) requestBody.reply_to = additionalOptions.reply_to;
						if (additionalOptions.scheduled_at) requestBody.scheduled_at = additionalOptions.scheduled_at;

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/emails',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});					} else if (operation === 'sendBatch') {
						const emailsData = this.getNodeParameter('emails', i) as any;
						const emailFormat = this.getNodeParameter('emailFormat', i) as string;
						
						const emails = emailsData.emails.map((email: any) => {
							const emailObj: any = {
								from: email.from,
								to: email.to.split(',').map((e: string) => e.trim()).filter((e: string) => e),
								subject: email.subject,
							};
							
							// Add content based on selected format
							if (emailFormat === 'html' && email.html) {
								emailObj.html = email.html;
							} else if (emailFormat === 'text' && email.text) {
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

					} else if (operation === 'retrieve') {
						const emailId = this.getNodeParameter('emailId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/emails/${emailId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});					} else if (operation === 'update') {
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
						});					} else if (operation === 'update') {
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
				} else if (resource === 'apiKeys') {					if (operation === 'create') {
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
				} else if (resource === 'broadcasts') {					if (operation === 'create') {
						const broadcastName = this.getNodeParameter('broadcastName', i) as string;
						const audienceId = this.getNodeParameter('audienceId', i) as string;
						const broadcastContent = this.getNodeParameter('broadcastContent', i, {}) as any;

						const requestBody: any = {
							name: broadcastName,
							audience_id: audienceId,
						};

						// Add optional content fields for create operation
						if (broadcastContent.from) requestBody.from = broadcastContent.from;
						if (broadcastContent.subject) requestBody.subject = broadcastContent.subject;
						if (broadcastContent.reply_to) requestBody.reply_to = broadcastContent.reply_to;
						if (broadcastContent.html) requestBody.html = broadcastContent.html;
						if (broadcastContent.text) requestBody.text = broadcastContent.text;
						if (broadcastContent.name) requestBody.name = broadcastContent.name;

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
						});					} else if (operation === 'update') {
						const broadcastId = this.getNodeParameter('broadcastId', i) as string;
						const broadcastContent = this.getNodeParameter('broadcastContent', i, {}) as any;

						const requestBody: any = {};
						if (broadcastContent.audience_id) requestBody.audience_id = broadcastContent.audience_id;
						if (broadcastContent.from) requestBody.from = broadcastContent.from;
						if (broadcastContent.subject) requestBody.subject = broadcastContent.subject;
						if (broadcastContent.reply_to) requestBody.reply_to = broadcastContent.reply_to;
						if (broadcastContent.html) requestBody.html = broadcastContent.html;
						if (broadcastContent.text) requestBody.text = broadcastContent.text;
						if (broadcastContent.name) requestBody.name = broadcastContent.name;

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

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/broadcasts/${broadcastId}/send`,
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {},
							json: true,
						});

					} else if (operation === 'list') {
						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/broadcasts',
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
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

				// AUDIENCE OPERATIONS
				} else if (resource === 'audiences') {
					if (operation === 'create') {
						const audienceName = this.getNodeParameter('audienceName', i) as string;

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/audiences',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {
								name: audienceName,
							},
							json: true,
						});

					} else if (operation === 'get') {
						const audienceId = this.getNodeParameter('audienceId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/audiences/${audienceId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'list') {
						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/audiences',
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'delete') {
						const audienceId = this.getNodeParameter('audienceId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/audiences/${audienceId}`,
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
						const audienceId = this.getNodeParameter('audienceId', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

						const requestBody: any = {
							email,
							audience_id: audienceId,
						};

						if (additionalFields.first_name) requestBody.first_name = additionalFields.first_name;
						if (additionalFields.last_name) requestBody.last_name = additionalFields.last_name;
						if (additionalFields.unsubscribed !== undefined) requestBody.unsubscribed = additionalFields.unsubscribed;

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
						const contactId = this.getNodeParameter('contactId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/contacts/${contactId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});					} else if (operation === 'update') {
						const audienceId = this.getNodeParameter('audienceId', i) as string;
						const updateBy = this.getNodeParameter('updateBy', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

						const requestBody: any = {};
						if (additionalFields.first_name) requestBody.first_name = additionalFields.first_name;
						if (additionalFields.last_name) requestBody.last_name = additionalFields.last_name;
						if (additionalFields.unsubscribed !== undefined) requestBody.unsubscribed = additionalFields.unsubscribed;

						let contactIdentifier: string;
						if (updateBy === 'id') {
							contactIdentifier = this.getNodeParameter('contactId', i) as string;
						} else {
							contactIdentifier = this.getNodeParameter('contactEmail', i) as string;
						}

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/audiences/${audienceId}/contacts/${contactIdentifier}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'list') {
						const audienceId = this.getNodeParameter('audienceId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/audiences/${audienceId}/contacts`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'delete') {
						const contactId = this.getNodeParameter('contactId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/contacts/${contactId}`,
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
