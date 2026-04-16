import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Log ID',
		name: 'logId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '37e4414c-5e25-4dbc-a071-43552a4bd53b',
		displayOptions: {
			show: {
				resource: ['logs'],
				operation: ['get'],
			},
		},
		description: 'The ID of the log to retrieve',
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const logId = this.getNodeParameter('logId', index) as string;

	const response = await apiRequest.call(this, 'GET', `/logs/${encodeURIComponent(logId)}`);

	return [{ json: response, pairedItem: { item: index } }];
}
