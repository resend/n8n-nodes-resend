import { INodeProperties } from 'n8n-workflow';

export const broadcastOperations: INodeProperties[] = [
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
];

export const broadcastFields: INodeProperties[] = [
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
		description:
			'Sender email address. To include a friendly name, use the format "Your Name &lt;sender@domain.com&gt;".',
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
		placeholder:
			'<p>Your HTML content here with {{{FIRST_NAME|there}}} and {{{RESEND_UNSUBSCRIBE_URL}}}</p>',
		displayOptions: {
			show: {
				resource: ['broadcasts'],
				operation: ['create'],
			},
		},
		description:
			'The HTML version of the message. You can use variables like {{{FIRST_NAME|fallback}}} and {{{RESEND_UNSUBSCRIBE_URL}}}.',
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
				displayName: 'From',
				name: 'from',
				type: 'string',
				default: '',
				placeholder: 'you@example.com',
				description: 'Sender email address',
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
				displayName: 'Segment ID',
				name: 'segment_id',
				type: 'string',
				default: '',
				placeholder: 'seg_123456',
				description: 'The ID of the segment you want to send to',
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
				description: 'Schedule the broadcast to be sent later (natural language or ISO 8601)',
			},
		],
	},
];
