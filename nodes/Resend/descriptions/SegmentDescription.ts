import { INodeProperties } from 'n8n-workflow';

export const segmentOperations: INodeProperties[] = [
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
];

export const segmentFields: INodeProperties[] = [
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
		displayName: 'Segment Name or ID',
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
		description: 'Select a segment or enter an ID using an expression. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
];
