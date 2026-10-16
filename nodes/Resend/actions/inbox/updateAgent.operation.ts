import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { inboxIdField, inboxPath } from './fields';

export const description: INodeProperties[] = [
  inboxIdField('updateAgent', 'The inbox whose agent settings to update'),
  {
    displayName: 'Update Fields',
    name: 'inboxAgentUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxes'],
        operation: ['updateAgent'],
      },
    },
    options: [
      {
        displayName: 'Actions',
        name: 'actions',
        type: 'multiOptions',
        default: [],
        options: [
          { name: 'Add Labels', value: 'add_labels' },
          { name: 'Archive', value: 'archive' },
          { name: 'Assign Thread', value: 'assign_thread' },
          { name: 'Draft Reply', value: 'draft_reply' },
          { name: 'Forward Thread', value: 'forward_thread' },
          { name: 'Mark as Spam', value: 'mark_as_spam' },
          { name: 'Move to Trash', value: 'move_to_trash' },
        ],
        description:
          'Actions the agent is allowed to take. Replaces the whole set. Duplicates are removed. Leave empty to disable all actions.',
      },
      {
        displayName: 'Clear Instructions',
        name: 'clearInstructions',
        type: 'boolean',
        default: false,
        description:
          'Whether to remove the current instructions. Overrides the Instructions field.',
      },
      {
        displayName: 'Clear Tone',
        name: 'clearTone',
        type: 'boolean',
        default: false,
        description:
          'Whether to remove the current tone. Overrides the Tone field.',
      },
      {
        displayName: 'Instructions',
        name: 'instructions',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        default: '',
        placeholder:
          'Answer refund questions yourself. Escalate legal threats.',
        description:
          "Instructions the agent follows when handling the inbox's threads (max 4000 characters)",
      },
      {
        displayName: 'Tone',
        name: 'tone',
        type: 'options',
        default: 'concise_professional',
        options: [
          { name: 'Concise Casual', value: 'concise_casual' },
          { name: 'Concise Professional', value: 'concise_professional' },
          { name: 'Expanded Casual', value: 'expanded_casual' },
          { name: 'Expanded Professional', value: 'expanded_professional' },
        ],
        description: 'Tone the agent writes in',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const fields = this.getNodeParameter('inboxAgentUpdateFields', index, {}) as {
    clearInstructions?: boolean;
    clearTone?: boolean;
    actions?: string[];
    instructions?: string;
    tone?: string;
  };

  const body: IDataObject = {};

  if (fields.clearInstructions) {
    body.instructions = null;
  } else if (fields.instructions) {
    body.instructions = fields.instructions;
  }
  if (fields.clearTone) {
    body.tone = null;
  } else if (fields.tone) {
    body.tone = fields.tone;
  }
  if (Array.isArray(fields.actions)) {
    body.actions = fields.actions;
  }

  if (Object.keys(body).length === 0) {
    throw new NodeOperationError(
      this.getNode(),
      'Set at least one of Actions, Instructions, or Tone to update the agent settings',
      { itemIndex: index },
    );
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    inboxPath(this, index, '/agent'),
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
