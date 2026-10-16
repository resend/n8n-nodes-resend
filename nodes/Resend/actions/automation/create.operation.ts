import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Name',
    name: 'automationName',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'Welcome series',
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['create'],
      },
    },
    description: 'The name of the automation',
  },
  {
    displayName: 'Steps (JSON)',
    name: 'automationSteps',
    type: 'json',
    required: true,
    default:
      '[\n  {\n    "key": "trigger",\n    "type": "trigger",\n    "config": { "event_name": "user.created" }\n  }\n]',
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['create'],
      },
    },
    description:
      "An array of step objects that define the automation's actions. Must include at least one trigger step. Step types: trigger, send_email, delay, wait_for_event, condition, contact_update, contact_delete, add_to_segment.",
  },
  {
    displayName: 'Connections (JSON)',
    name: 'automationConnections',
    type: 'json',
    required: true,
    default: '[]',
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['create'],
      },
    },
    description:
      'An array of connection objects that define the links between steps. Can be an empty array for single-step automations.',
  },
  {
    displayName: 'Additional Options',
    name: 'additionalOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Enabled', value: 'enabled' },
          { name: 'Disabled', value: 'disabled' },
        ],
        default: 'disabled',
        description: 'The status of the automation. Defaults to disabled.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('automationName', index) as string;
  const steps = this.getNodeParameter('automationSteps', index) as
    | string
    | object;
  const connections = this.getNodeParameter('automationConnections', index) as
    | string
    | object;
  const additionalOptions = this.getNodeParameter(
    'additionalOptions',
    index,
    {},
  ) as {
    status?: string;
  };

  const body: IDataObject = {
    name,
    steps: typeof steps === 'string' ? JSON.parse(steps) : steps,
    connections:
      typeof connections === 'string' ? JSON.parse(connections) : connections,
  };

  if (additionalOptions.status) {
    body.status = additionalOptions.status;
  }

  const response = await apiRequest.call(this, 'POST', '/automations', body);

  return [{ json: response, pairedItem: { item: index } }];
}
