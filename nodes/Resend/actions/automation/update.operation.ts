import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
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
    options: [
      { name: 'Enabled', value: 'enabled' },
      { name: 'Disabled', value: 'disabled' },
      { name: 'Unchanged', value: '' },
    ],
    default: '',
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['update'],
      },
    },
    description:
      'The status of the automation. Choose Unchanged to keep the current status.',
  },
  {
    displayName: 'Update Fields',
    name: 'automationUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['automations'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Connections (JSON)',
        name: 'connections',
        type: 'json',
        default: '[]',
        description:
          'An array of connection objects between steps. Must be provided together with Steps. The graph of an enabled automation cannot be updated.',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'The new name of the automation',
      },
      {
        displayName: 'Steps (JSON)',
        name: 'steps',
        type: 'json',
        default: '[]',
        description:
          'An array of step objects that replaces the automation graph. Must be provided together with Connections. The graph of an enabled automation cannot be updated.',
      },
    ],
  },
];

function parseJsonField(
  this: IExecuteFunctions,
  value: string | object | undefined,
  label: string,
  index: number,
): IDataObject | IDataObject[] | undefined {
  if (typeof value !== 'string') {
    return value as IDataObject | IDataObject[] | undefined;
  }
  try {
    return JSON.parse(value) as IDataObject | IDataObject[];
  } catch {
    throw new NodeOperationError(
      this.getNode(),
      `${label} must be valid JSON`,
      { itemIndex: index },
    );
  }
}

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const automationId = this.getNodeParameter('automationId', index) as string;
  const status = this.getNodeParameter('automationStatus', index, '') as string;
  const updateFields = this.getNodeParameter(
    'automationUpdateFields',
    index,
    {},
  ) as {
    connections?: string | object;
    name?: string;
    steps?: string | object;
  };

  const body: IDataObject = {};
  if (status) {
    body.status = status;
  }
  if (updateFields.name) {
    body.name = updateFields.name;
  }
  const hasSteps = updateFields.steps !== undefined;
  const hasConnections = updateFields.connections !== undefined;
  if (hasSteps !== hasConnections) {
    throw new NodeOperationError(
      this.getNode(),
      'Steps and Connections must be provided together',
      { itemIndex: index },
    );
  }
  if (hasSteps && hasConnections) {
    body.steps = parseJsonField.call(this, updateFields.steps, 'Steps', index);
    body.connections = parseJsonField.call(
      this,
      updateFields.connections,
      'Connections',
      index,
    );
  }
  if (Object.keys(body).length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'Provide a status, name, or steps and connections to update',
      { itemIndex: index },
    );
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/automations/${encodeURIComponent(automationId)}`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
