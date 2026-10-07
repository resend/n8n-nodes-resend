import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Automation ID',
    name: 'automationId',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'c9b16d4f-ba6c-4e2e-b044-6bf4404e57fd',
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['update'],
      },
    },
    description: 'The unique identifier of the automation to update',
  },
  {
    displayName: 'Status',
    name: 'automationStatus',
    type: 'options',
    required: true,
    options: [
      { name: 'Enabled', value: 'enabled' },
      { name: 'Disabled', value: 'disabled' },
    ],
    default: 'enabled',
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['update'],
      },
    },
    description: 'The status of the automation',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const automationId = this.getNodeParameter('automationId', index) as string;
  const status = this.getNodeParameter('automationStatus', index) as string;

  const body: IDataObject = { status };

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/automations/${encodeURIComponent(automationId)}`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
