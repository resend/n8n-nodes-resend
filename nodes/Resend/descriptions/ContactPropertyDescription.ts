import {
	INodeProperties,
} from 'n8n-workflow';

export const contactPropertyOperations: INodeProperties[] = [
	// CONTACT PROPERTY OPERATIONS
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contactProperties'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a contact property',
				action: 'Create a contact property',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a contact property',
				action: 'Delete a contact property',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a contact property',
				action: 'Get a contact property',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List contact properties',
				action: 'List contact properties',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a contact property',
				action: 'Update a contact property',
			},
		],
		default: 'list',
	},
];

export const contactPropertyFields: INodeProperties[] = [
	// CONTACT PROPERTY FIELDS
	{
		displayName: 'Key',
		name: 'contactPropertyKey',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'company_name',
		displayOptions: {
			show: {
				resource: ['contactProperties'],
				operation: ['create'],
			},
		},
		description: 'Key for the contact property (letters, numbers, underscores).',
	},
	{
		displayName: 'Type',
		name: 'contactPropertyType',
		type: 'options',
		required: true,
		default: 'string',
		displayOptions: {
			show: {
				resource: ['contactProperties'],
				operation: ['create'],
			},
		},
		options: [
			{ name: 'String', value: 'string' },
			{ name: 'Number', value: 'number' },
		],
		description: 'Data type for the contact property.',
	},
	{
		displayName: 'Fallback Value',
		name: 'contactPropertyFallbackValue',
		type: 'string',
		default: '',
		placeholder: 'Acme Corp',
		displayOptions: {
			show: {
				resource: ['contactProperties'],
				operation: ['create'],
			},
		},
		description: 'Default value when the property is not set on a contact.',
	},
	{
		displayName: 'Contact Property ID',
		name: 'contactPropertyId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'b6d24b8e-af0b-4c3c-be0c-359bbd97381e',
		displayOptions: {
			show: {
				resource: ['contactProperties'],
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'The ID of the contact property.',
	},
	{
		displayName: 'Update Fields',
		name: 'contactPropertyUpdateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['contactProperties'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Fallback Value',
				name: 'fallback_value',
				type: 'string',
				default: '',
				placeholder: 'Acme Corp',
				description: 'Default value when the property is not set on a contact.',
			},
		],
	},
	{
		displayName: 'List Options',
		name: 'contactPropertyListOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['contactProperties'],
				operation: ['list'],
			},
		},
		options: [
			{
				displayName: 'After',
				name: 'after',
				type: 'string',
				default: '',
				description: 'Return results after this contact property ID.',
			},
			{
				displayName: 'Before',
				name: 'before',
				type: 'string',
				default: '',
				description: 'Return results before this contact property ID.',
			},
		],
	},
];
