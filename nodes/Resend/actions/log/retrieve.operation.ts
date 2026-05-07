import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Log ID',
		name: 'logId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'log_abc123',
		displayOptions: {
			show: {
				resource: ['logs'],
				operation: ['retrieve'],
			},
		},
		description: 'The unique identifier of the log entry to retrieve',
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
