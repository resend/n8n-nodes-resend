import { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as get from './get.operation';
import * as list from './list.operation';
import * as listContacts from './listContacts.operation';
import * as del from './delete.operation';

export { create, get, list, listContacts, del as delete };
export { execute } from './execute';

export const operations: INodeProperties[] = [
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
				description: 'Create a new contact segment for grouping contacts based on criteria or manual assignment',
				action: 'Create a contact segment',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Permanently delete a segment by its segment ID. Contacts in the segment are not deleted.',
				action: 'Delete a segment',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve details of a specific segment including its name, contact count, and creation date',
				action: 'Get segment details',
			},
			{
				name: 'List',
				value: 'list',
				description: 'Get all segments in the account with their names, IDs, and contact counts',
				action: 'List all segments',
			},
			{
				name: 'List Contacts',
				value: 'listContacts',
				description: 'Get all contacts belonging to a specific segment',
				action: 'List segment contacts',
			},
		],
		default: 'list',
	},
];

export const descriptions: INodeProperties[] = [
	...operations,
	...create.description,
	...get.description,
	...list.description,
	...listContacts.description,
	...del.description,
];
