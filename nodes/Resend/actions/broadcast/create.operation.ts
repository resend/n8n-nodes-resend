import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequest, normalizeEmailList } from '../../transport';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';

export const description: INodeProperties[] = [
  {
    displayName:
      'Variable Syntax: Use {{{VARIABLE_NAME|fallback}}} for personalization. Required: Include {{{RESEND_UNSUBSCRIBE_URL}}} in your content.',
    name: 'broadcastNotice',
    type: 'notice',
    default: '',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['create'],
      },
    },
  },
  createDynamicIdField({
    fieldName: 'segmentId',
    resourceName: 'segment',
    displayName: 'Target Segment',
    required: true,
    placeholder: 'seg_123456',
    description:
      'The segment to target with this broadcast. All contacts in the selected segment will receive the broadcast.',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['create'],
      },
    },
  }),
  {
    displayName: 'From',
    name: 'broadcastFrom',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'you@example.com',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['create'],
      },
    },
    description:
      'Sender email address for the broadcast. Must be from a verified domain. To include a friendly name, use the format "Your Name &lt;sender@domain.com&gt;".',
  },
  {
    displayName: 'Subject',
    name: 'broadcastSubject',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'Newsletter Subject',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['create'],
      },
    },
    description:
      'The subject line of the broadcast email. Keep it concise and compelling to maximize open rates.',
  },
  {
    displayName: 'HTML Content',
    name: 'broadcastHtml',
    type: 'string',
    default: '',
    typeOptions: {
      multiline: true,
    },
    placeholder:
      '<p>Your HTML content here with {{{FIRST_NAME|there}}} and {{{RESEND_UNSUBSCRIBE_URL}}}</p>',
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['create'],
      },
    },
    description:
      'The HTML content of the broadcast email. Use variables like {{{FIRST_NAME|fallback}}} for personalization and {{{RESEND_UNSUBSCRIBE_URL}}} for the required unsubscribe link.',
  },
  {
    displayName: 'Create Options',
    name: 'broadcastCreateOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['broadcasts'],
        operation: ['create'],
      },
    },
    options: [
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
        displayName: 'Preview Text',
        name: 'previewText',
        type: 'string',
        default: '',
        placeholder: 'Here are our announcements',
        description:
          'The preview text shown next to the subject line in most email clients',
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
        displayName: 'Scheduled At',
        name: 'scheduledAt',
        type: 'string',
        default: '',
        placeholder: 'in 1 hour',
        description:
          'Schedule the broadcast for later delivery. Accepts natural language (e.g., "in 1 hour") or ISO 8601 format. Requires Send Immediately to be enabled.',
      },
      {
        displayName: 'Send Immediately',
        name: 'send',
        type: 'boolean',
        default: false,
        description:
          'Whether to send (or schedule, if Scheduled At is set) the broadcast right after creating it instead of keeping it as a draft',
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
          'Plain text version of the email for clients that do not support HTML. If omitted, Resend will auto-generate from the HTML content.',
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
  const segmentId = resolveDynamicIdValue(this, 'segmentId', index);
  const from = this.getNodeParameter('broadcastFrom', index) as string;
  const subject = this.getNodeParameter('broadcastSubject', index) as string;
  const html = this.getNodeParameter('broadcastHtml', index) as string;
  const createOptions = this.getNodeParameter(
    'broadcastCreateOptions',
    index,
    {},
  ) as {
    name?: string;
    previewText?: string;
    replyTo?: string;
    scheduledAt?: string;
    send?: boolean;
    text?: string;
    topicId?: string;
  };

  const body: IDataObject = {
    segment_id: segmentId,
    from,
    subject,
  };

  if (html) {
    body.html = html;
  }

  if (createOptions.name) {
    body.name = createOptions.name;
  }
  if (createOptions.previewText) {
    body.preview_text = createOptions.previewText;
  }
  const replyTo = normalizeEmailList(createOptions.replyTo);
  if (replyTo.length) {
    body.reply_to = replyTo.length === 1 ? replyTo[0] : replyTo;
  }
  if (createOptions.text) {
    body.text = createOptions.text;
  }
  if (createOptions.topicId) {
    body.topic_id = createOptions.topicId;
  }
  if (createOptions.scheduledAt && !createOptions.send) {
    throw new NodeOperationError(
      this.getNode(),
      'Scheduled At requires Send Immediately to be enabled',
      { itemIndex: index },
    );
  }
  if (createOptions.send) {
    body.send = true;
    if (createOptions.scheduledAt) {
      body.scheduled_at = createOptions.scheduledAt;
    }
  }

  const response = await apiRequest.call(this, 'POST', '/broadcasts', body);

  return [{ json: response, pairedItem: { item: index } }];
}
