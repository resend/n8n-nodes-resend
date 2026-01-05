import { INodeProperties } from 'n8n-workflow';

export const topicOperations: INodeProperties[] = [
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
];

export const topicFields: INodeProperties[] = [
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
		displayName: 'Topic Name or ID',
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
		description: 'Select a topic or enter an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
];
