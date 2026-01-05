import { INodeProperties } from 'n8n-workflow';

export const contactOperations: INodeProperties[] = [
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
];

export const contactFields: INodeProperties[] = [
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
			{
				displayName: 'Unsubscribed',
				name: 'unsubscribed',
				type: 'boolean',
				default: false,
				description: 'Whether the contact is unsubscribed from emails',
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
];
