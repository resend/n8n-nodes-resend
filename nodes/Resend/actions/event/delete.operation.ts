import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Event ID or Name',
    name: 'eventIdentifier',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'user.created',
    displayOptions: {
      show: {
        resource: ['events'],
        operation: ['delete'],
      },
    },
    description: 'The ID or name of the event to delete',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const identifier = this.getNodeParameter('eventIdentifier', index) as string;

  const response = await apiRequest.call(
    this,
    'DELETE',
    `/events/${encodeURIComponent(identifier)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
