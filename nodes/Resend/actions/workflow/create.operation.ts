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
    name: 'workflowName',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'Welcome series',
    displayOptions: {
      show: {
        resource: ['workflows'],
        operation: ['create'],
      },
    },
    description: 'The name of the workflow',
  },
  {
    displayName: 'Steps (JSON)',
    name: 'workflowSteps',
    type: 'json',
    required: true,
    default:
      '[\n  {\n    "ref": "trigger",\n    "type": "trigger",\n    "config": { "eventName": "user.created" }\n  }\n]',
    displayOptions: {
      show: {
        resource: ['workflows'],
        operation: ['create'],
      },
    },
    description:
      "An array of step objects that define the workflow's actions. Must include at least one trigger step. Step types: trigger, send_email, delay, wait_for_event, condition.",
  },
  {
    displayName: 'Edges (JSON)',
    name: 'workflowEdges',
    type: 'json',
    required: true,
    default: '[]',
    displayOptions: {
      show: {
        resource: ['workflows'],
        operation: ['create'],
      },
    },
    description:
      'An array of edge objects that define connections between steps. Can be an empty array for single-step workflows.',
  },
  {
    displayName: 'Additional Options',
    name: 'additionalOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['workflows'],
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
        description: 'The status of the workflow. Defaults to disabled.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('workflowName', index) as string;
  const steps = this.getNodeParameter('workflowSteps', index) as
    | string
    | object;
  const edges = this.getNodeParameter('workflowEdges', index) as
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
    edges: typeof edges === 'string' ? JSON.parse(edges) : edges,
  };

  if (additionalOptions.status) {
    body.status = additionalOptions.status;
  }

  const response = await apiRequest.call(this, 'POST', '/workflows', body);

  return [{ json: response, pairedItem: { item: index } }];
}
