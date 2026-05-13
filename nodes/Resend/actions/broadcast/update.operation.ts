import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';

export const description: INodeProperties[] = [
  createDynamicIdField({
    fieldName: 'broadcastId',
    resourceName: 'broadcast',
    displayName: 'Broadcast',
    required: true,
    placeholder: 'bc_123456',
    description:
      'The unique identifier of the broadcast to update. Only unsent broadcasts can be modified. Obtain from the Create Broadcast response.',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['update'],
      },
    },
  }),
  {
    displayName: 'Update Fields',
    name: 'broadcastUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'From',
        name: 'from',
        type: 'string',
        default: '',
        placeholder: 'you@example.com',
        description:
          'Sender email address for the broadcast. Must be from a verified domain. Format: "Name &lt;email@domain.com&gt;" or just "email@domain.com".',
      },
      {
        displayName: 'HTML Content',
        name: 'html',
        type: 'string',
        default: '',
        typeOptions: {
          multiline: true,
        },
        placeholder: '<p>Your HTML content here</p>',
        description:
          'The HTML body of the broadcast email. Use {{{VARIABLE|fallback}}} for personalization and include {{{RESEND_UNSUBSCRIBE_URL}}} for the required unsubscribe link.',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        placeholder: 'Internal broadcast name',
        description:
          'The friendly name of the broadcast. Only used for internal reference.',
      },
      {
        displayName: 'Reply To',
        name: 'replyTo',
        type: 'string',
        default: '',
        placeholder: 'noreply@example.com',
        description:
          'Reply-to email address. For multiple addresses, use comma-separated values.',
      },
      {
        displayName: 'Subject',
        name: 'subject',
        type: 'string',
        default: '',
        placeholder: 'Newsletter Subject',
        description:
          'Email subject line. Keep concise and compelling to maximize open rates.',
      },
      {
        displayName: 'Target Segment Name or ID',
        name: 'segmentId',
        type: 'options',
        default: '',
        typeOptions: {
          loadOptionsMethod: 'getSegments',
        },
        description:
          'The segment to target. All contacts in this segment will receive the broadcast. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: 'Text Content',
        name: 'text',
        type: 'string',
        default: '',
        typeOptions: {
          multiline: true,
        },
        placeholder: 'Your plain text content here',
        description:
          'Plain text version of the email for clients that do not support HTML. If omitted, Resend will auto-generate from HTML.',
      },
      {
        displayName: 'Topic Name or ID',
        name: 'topicId',
        type: 'options',
        default: '',
        typeOptions: {
          loadOptionsMethod: 'getTopics',
        },
        description:
          'Topic to scope the broadcast to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const broadcastId = resolveDynamicIdValue(this, 'broadcastId', index);
  const updateFields = this.getNodeParameter(
    'broadcastUpdateFields',
    index,
    {},
  ) as IDataObject;

  const body: IDataObject = {};
  if (updateFields.from) body.from = updateFields.from;
  if (updateFields.html) body.html = updateFields.html;
  if (updateFields.name) body.name = updateFields.name;
  if (updateFields.replyTo) body.reply_to = updateFields.replyTo;
  if (updateFields.subject) body.subject = updateFields.subject;
  if (updateFields.segmentId) body.segment_id = updateFields.segmentId;
  if (updateFields.text) body.text = updateFields.text;
  if (updateFields.topicId) body.topic_id = updateFields.topicId;

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/broadcasts/${encodeURIComponent(broadcastId)}`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
