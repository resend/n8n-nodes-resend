import type { INodeProperties } from 'n8n-workflow';

import * as get from './get.operation';
import * as list from './list.operation';

export { get, list };
export { execute } from './execute';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['logs'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single API request log by ID',
				action: 'Get a log',
			},
			{
				name: 'List',
				value: 'list',
				description: 'Retrieve a list of API request logs',
				action: 'List all logs',
			},
		],
		default: 'list',
	},
];

export const descriptions: INodeProperties[] = [
	...operations,
	...get.description,
	...list.description,
];
