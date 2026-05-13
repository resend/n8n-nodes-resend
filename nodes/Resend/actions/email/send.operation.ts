import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
  buildTemplateSendVariables,
  handleResendApiError,
  normalizeEmailList,
  RESEND_API_BASE,
} from '../../transport';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';

export const description: INodeProperties[] = [
  {
    displayName:
      'Tips: The sender address must be from a verified domain. Scheduled emails cannot include attachments. Maximum 50 recipients per email.',
    name: 'sendEmailNotice',
    type: 'notice',
    default: '',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
      },
    },
  },
  {
    displayName: 'From',
    name: 'from',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'you@example.com',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
      },
    },
    description:
      'The sender email address that will appear in the "From" field. Must be from a verified domain. To include a display name, use format "Your Name &lt;sender@domain.com&gt;". Example: "Support Team &lt;support@company.com&gt;".',
  },
  {
    displayName: 'To',
    name: 'to',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'user@example.com',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
      },
    },
    description:
      'The recipient email address(es) to send the email to. For multiple recipients, separate addresses with commas. Maximum 50 recipients per email. Example: "user1@example.com, user2@example.com".',
  },
  {
    displayName: 'Subject',
    name: 'subject',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'Hello from n8n!',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
      },
    },
    description:
      'The email subject line that recipients will see. Keep it concise and descriptive.',
  },
  {
    displayName: 'Use Template',
    name: 'useTemplate',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
      },
    },
    description:
      'Whether to use a pre-built email template instead of providing HTML/Text content directly. Templates allow reusable designs with dynamic variables.',
  },
  {
    displayName: 'Email Format',
    name: 'emailFormat',
    type: 'options',
    options: [
      {
        name: 'HTML',
        value: 'html',
        description:
          'Send email with rich HTML formatting including images, links, and styled text',
      },
      {
        name: 'HTML and Text',
        value: 'both',
        description:
          'Send both HTML and plain text versions for maximum compatibility across email clients',
      },
      {
        name: 'Text',
        value: 'text',
        description:
          'Send plain text email without formatting for simple messages',
      },
    ],
    default: 'html',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
        useTemplate: [false],
      },
    },
    description:
      'Choose the content format for your email. HTML enables rich formatting, text is simple and universally compatible, both provides a fallback.',
  },
  createDynamicIdField({
    fieldName: 'emailTemplateId',
    resourceName: 'template',
    displayName: 'Email Template',
    required: false, // Templates are optional for emails
    placeholder: '34a080c9-b17d-4187-ad80-5af20266e535',
    description: 'Template to use for this email',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
        useTemplate: [true],
      },
    },
  }),
  {
    displayName: 'Template Variables',
    name: 'emailTemplateVariables',
    type: 'fixedCollection',
    default: { variables: [] },
    typeOptions: {
      multipleValues: true,
    },
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
        useTemplate: [true],
      },
    },
    description: 'Variables to render the template with',
    options: [
      {
        name: 'variables',
        displayName: 'Variable',
        values: [
          {
            displayName: 'Key',
            name: 'key',
            type: 'resourceLocator',
            default: { mode: 'list', value: '' },
            required: true,
            description:
              'Template variable name. Select from the template or enter a custom key.',
            modes: [
              {
                displayName: 'From List',
                name: 'list',
                type: 'list',
                placeholder: 'Select variable...',
                typeOptions: {
                  searchListMethod: 'getTemplateVariables',
                },
              },
              {
                displayName: 'By Key',
                name: 'id',
                type: 'string',
                placeholder: 'Enter variable key...',
              },
            ],
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'string',
            default: '',
            description: 'Value for the template variable',
          },
        ],
      },
    ],
  },
  {
    displayName: 'HTML Content',
    name: 'html',
    type: 'string',
    default: '',
    typeOptions: {
      multiline: true,
      rows: 4,
    },
    placeholder: '<p>Your HTML content here</p>',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
        emailFormat: ['html', 'both'],
        useTemplate: [false],
      },
    },
    description:
      'The HTML body of the email. Supports full HTML including inline CSS, images (via URLs or cid: for inline attachments), tables, and links. Example: "&lt;h1&gt;Welcome&lt;/h1&gt;&lt;p&gt;Hello {{name}}!&lt;/p&gt;".',
  },
  {
    displayName: 'Text Content',
    name: 'text',
    type: 'string',
    default: '',
    typeOptions: {
      multiline: true,
      rows: 4,
    },
    placeholder: 'Your plain text content here',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
        emailFormat: ['text', 'both'],
        useTemplate: [false],
      },
    },
    description:
      'The plain text version of the email body. Used as fallback for email clients that cannot display HTML, or as the primary content for text-only emails.',
  },
  {
    displayName: 'Additional Options',
    name: 'additionalOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['send'],
      },
    },
    options: [
      {
        displayName: 'Attachments',
        name: 'attachments',
        type: 'fixedCollection',
        default: { attachments: [] },
        typeOptions: {
          multipleValues: true,
        },
        description:
          'Add file attachments to the email. Can be binary data from previous nodes or remote URLs. Note: Attachments are not supported with scheduled emails.',
        options: [
          {
            name: 'attachments',
            displayName: 'Attachment',
            values: [
              {
                displayName: 'Attachment Type',
                name: 'attachmentType',
                type: 'options',
                default: 'binaryData',
                options: [
                  {
                    name: 'Binary Data',
                    value: 'binaryData',
                    description:
                      'Use binary file data from a previous node in the workflow',
                  },
                  {
                    name: 'Remote URL',
                    value: 'url',
                    description: 'Download and attach a file from a public URL',
                  },
                ],
              },
              {
                displayName: 'Binary Property',
                name: 'binaryPropertyName',
                type: 'string',
                default: 'data',
                placeholder: 'data',
                description:
                  'The name of the binary property containing the file data. Default is "data" which is the standard output from file nodes.',
                displayOptions: {
                  show: {
                    attachmentType: ['binaryData'],
                  },
                },
              },
              {
                displayName: 'Content ID',
                name: 'content_id',
                type: 'string',
                default: '',
                placeholder: 'image-1',
                description:
                  'Content ID for embedding images inline in HTML using cid: references. Example: Use "logo" here and reference it in HTML as &lt;img src="cid:logo"&gt;.',
              },
              {
                displayName: 'Content Type',
                name: 'content_type',
                type: 'string',
                default: '',
                placeholder: 'image/png',
                description:
                  'The MIME type of the attachment. Examples: "application/pdf", "image/png", "image/jpeg", "text/csv".',
              },
              {
                displayName: 'File Name',
                name: 'filename',
                type: 'string',
                default: '',
                placeholder: 'document.pdf',
                description:
                  'The filename that will appear for the attachment in the email. Required for both binary data and URL attachments.',
              },
              {
                displayName: 'File URL',
                name: 'fileUrl',
                type: 'string',
                default: '',
                placeholder: 'https://example.com/file.pdf',
                description:
                  'The publicly accessible URL to download the file from. Must be a direct link to the file.',
                displayOptions: {
                  show: {
                    attachmentType: ['url'],
                  },
                },
              },
            ],
          },
        ],
      },
      {
        displayName: 'BCC',
        name: 'bcc',
        type: 'string',
        default: '',
        description:
          'Blind carbon copy recipients who will receive the email without other recipients seeing them. Comma-separated for multiple addresses.',
      },
      {
        displayName: 'CC',
        name: 'cc',
        type: 'string',
        default: '',
        description:
          'Carbon copy recipients who will be visible to all recipients. Comma-separated for multiple addresses.',
      },
      {
        displayName: 'Headers',
        name: 'headers',
        type: 'fixedCollection',
        default: { headers: [] },
        typeOptions: {
          multipleValues: true,
        },
        options: [
          {
            name: 'headers',
            displayName: 'Header',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                required: true,
                default: '',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
              },
            ],
          },
        ],
        description:
          'Custom email headers to include in the message. Useful for tracking, thread management, or custom metadata.',
      },
      {
        displayName: 'Idempotency Key',
        name: 'idempotencyKey',
        type: 'string',
        default: '',
        description:
          'A unique key to ensure the email is sent only once. Useful for retries to prevent duplicate sends.',
      },
      {
        displayName: 'Reply To',
        name: 'replyTo',
        type: 'string',
        default: '',
        description:
          'The email address where replies should be sent. Use this if you want replies to go to a different address than the sender. Comma-separated for multiple addresses.',
      },
      {
        displayName: 'Scheduled At',
        name: 'scheduledAt',
        type: 'string',
        default: '',
        description:
          'Schedule the email to be sent at a future time. Accepts natural language like "in 1 hour" or ISO 8601 format "2024-12-25T09:00:00Z". Note: Cannot use attachments with scheduled emails.',
      },
      {
        displayName: 'Tags',
        name: 'tags',
        type: 'fixedCollection',
        default: { tags: [] },
        typeOptions: {
          multipleValues: true,
        },
        options: [
          {
            name: 'tags',
            displayName: 'Tag',
            values: [
              {
                displayName: 'Name',
                name: 'name',
                type: 'string',
                required: true,
                default: '',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                required: true,
                default: '',
              },
            ],
          },
        ],
        description:
          'Key-value tags to categorize and track emails. Useful for analytics and filtering. Example: name="campaign", value="welcome-series".',
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
          'Associate this email with a specific subscription topic. Used for managing email preferences and unsubscribe handling. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
    ],
  },
];

interface AttachmentInput {
  attachmentType: 'binaryData' | 'url';
  binaryPropertyName?: string;
  filename?: string;
  fileUrl?: string;
  contentId?: string;
  contentType?: string;
}

interface HeaderInput {
  name: string;
  value?: string;
}

interface TagInput {
  name: string;
  value?: string;
}

interface AdditionalOptions {
  attachments?: { attachments: AttachmentInput[] };
  bcc?: string;
  cc?: string;
  headers?: { headers: HeaderInput[] };
  replyTo?: string;
  scheduledAt?: string;
  tags?: { tags: TagInput[] };
  topicId?: string;
  idempotencyKey?: string;
}

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const from = this.getNodeParameter('from', index) as string;
  const toValue = this.getNodeParameter('to', index) as string | string[];
  const subject = this.getNodeParameter('subject', index) as string;
  const useTemplate = this.getNodeParameter('useTemplate', index) as boolean;
  const additionalOptions = this.getNodeParameter(
    'additionalOptions',
    index,
    {},
  ) as AdditionalOptions;

  const requestBody: Record<string, unknown> = {
    from,
    to: normalizeEmailList(toValue),
    subject,
  };

  if (useTemplate) {
    const templateId = resolveDynamicIdValue(this, 'emailTemplateId', index);
    const templateVariables = this.getNodeParameter(
      'emailTemplateVariables',
      index,
      {},
    ) as {
      variables?: Array<{ key: string; value?: unknown }>;
    };

    if (!templateId) {
      throw new NodeOperationError(
        this.getNode(),
        'Template Name or ID is required when sending with a template.',
        { itemIndex: index },
      );
    }

    const html = this.getNodeParameter('html', index, '') as string;
    const text = this.getNodeParameter('text', index, '') as string;
    if (html || text) {
      throw new NodeOperationError(
        this.getNode(),
        'HTML/Text Content cannot be used when sending with a template.',
        { itemIndex: index },
      );
    }

    requestBody.template = { id: templateId };
    const variables = buildTemplateSendVariables(templateVariables);
    if (variables && Object.keys(variables).length) {
      (requestBody.template as Record<string, unknown>).variables = variables;
    }
  } else {
    // Default to 'html' if emailFormat wasn't set (e.g., when switching from template mode)
    const emailFormat =
      (this.getNodeParameter('emailFormat', index, 'html') as string) || 'html';
    if (emailFormat === 'html' || emailFormat === 'both') {
      const html = this.getNodeParameter('html', index, '') as string;
      if (!html) {
        throw new NodeOperationError(
          this.getNode(),
          'HTML Content is required.',
          {
            itemIndex: index,
          },
        );
      }
      requestBody.html = html;
    }
    if (emailFormat === 'text' || emailFormat === 'both') {
      const text = this.getNodeParameter('text', index, '') as string;
      if (!text) {
        throw new NodeOperationError(
          this.getNode(),
          'Text Content is required.',
          {
            itemIndex: index,
          },
        );
      }
      requestBody.text = text;
    }
  }

  // Handle CC
  if (additionalOptions.cc) {
    const ccList = normalizeEmailList(additionalOptions.cc);
    if (ccList.length) {
      requestBody.cc = ccList;
    }
  }

  // Handle BCC
  if (additionalOptions.bcc) {
    const bccList = normalizeEmailList(additionalOptions.bcc);
    if (bccList.length) {
      requestBody.bcc = bccList;
    }
  }

  // Handle Reply To
  if (additionalOptions.replyTo) {
    const replyToList = normalizeEmailList(additionalOptions.replyTo);
    if (replyToList.length) {
      requestBody.reply_to = replyToList;
    }
  }

  // Handle Headers
  if (additionalOptions.headers?.headers?.length) {
    const headers: Record<string, string> = {};
    for (const header of additionalOptions.headers.headers) {
      if (header.name) {
        headers[header.name] = header.value ?? '';
      }
    }
    if (Object.keys(headers).length) {
      requestBody.headers = headers;
    }
  }

  // Handle Tags
  if (additionalOptions.tags?.tags?.length) {
    requestBody.tags = additionalOptions.tags.tags
      .filter((tag) => tag.name)
      .map((tag) => ({
        name: tag.name,
        value: tag.value ?? '',
      }));
  }

  // Handle Topic ID
  if (additionalOptions.topicId) {
    requestBody.topic_id = additionalOptions.topicId;
  }

  // Handle Scheduled At
  if (additionalOptions.scheduledAt) {
    requestBody.scheduled_at = additionalOptions.scheduledAt;
  }

  // Validate attachments + scheduledAt
  if (
    additionalOptions.attachments?.attachments?.length &&
    additionalOptions.scheduledAt
  ) {
    throw new NodeOperationError(
      this.getNode(),
      'Attachments cannot be used with scheduled emails. Please remove either the attachments or the scheduled time.',
      { itemIndex: index },
    );
  }

  // Handle Attachments
  if (additionalOptions.attachments?.attachments?.length) {
    requestBody.attachments = additionalOptions.attachments.attachments
      .map((attachment) => {
        const contentId = attachment.contentId;
        const contentType = attachment.contentType;

        if (attachment.attachmentType === 'binaryData') {
          const binaryPropertyName = attachment.binaryPropertyName || 'data';
          const binaryData = items[index].binary?.[binaryPropertyName];
          if (!binaryData) {
            throw new NodeOperationError(
              this.getNode(),
              `Binary property "${binaryPropertyName}" not found in item ${index}`,
              { itemIndex: index },
            );
          }

          const filename = attachment.filename || binaryData.fileName;
          if (!filename) {
            throw new NodeOperationError(
              this.getNode(),
              'File Name is required for binary attachments.',
              { itemIndex: index },
            );
          }

          const attachmentEntry: Record<string, unknown> = {
            filename,
            content: binaryData.data,
          };
          if (contentId) {
            attachmentEntry.content_id = contentId;
          }
          if (contentType) {
            attachmentEntry.content_type = contentType;
          }
          return attachmentEntry;
        }
        if (attachment.attachmentType === 'url') {
          if (!attachment.filename) {
            throw new NodeOperationError(
              this.getNode(),
              'File Name is required for URL attachments.',
              { itemIndex: index },
            );
          }
          if (!attachment.fileUrl) {
            throw new NodeOperationError(
              this.getNode(),
              'File URL is required for URL attachments.',
              { itemIndex: index },
            );
          }
          const attachmentEntry: Record<string, unknown> = {
            filename: attachment.filename,
            path: attachment.fileUrl,
          };
          if (contentId) {
            attachmentEntry.content_id = contentId;
          }
          if (contentType) {
            attachmentEntry.content_type = contentType;
          }
          return attachmentEntry;
        }
        return null;
      })
      .filter(
        (attachment): attachment is Record<string, unknown> =>
          attachment !== null,
      );
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (additionalOptions.idempotencyKey) {
    requestHeaders['Idempotency-Key'] = additionalOptions.idempotencyKey;
  }

  let response;
  try {
    response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      'resendApi',
      {
        url: `${RESEND_API_BASE}/emails`,
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
        json: true,
      },
    );
  } catch (error) {
    handleResendApiError(this.getNode(), error, index);
  }

  return [{ json: response, pairedItem: { item: index } }];
}
