import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
  buildTemplateSendVariables,
  getCredentialType,
  handleResendApiError,
  normalizeEmailList,
  RESEND_API_BASE,
} from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Emails',
    name: 'emails',
    type: 'fixedCollection',
    required: true,
    default: { emails: [{}] },
    typeOptions: {
      multipleValues: true,
    },
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['sendBatch'],
      },
    },
    description:
      'Array of emails to send in a single API call. Maximum 100 emails per batch. Each email can have different recipients, content, and options.',
    options: [
      {
        name: 'emails',
        displayName: 'Email',
        values: [
          {
            displayName: 'Additional Options',
            name: 'additionalOptions',
            type: 'collection',
            default: {},
            placeholder: 'Add Option',
            options: [
              {
                displayName: 'BCC',
                name: 'bcc',
                type: 'string',
                default: '',
                description:
                  'Blind carbon copy recipients. Comma-separated. Recipients will not see other BCC addresses.',
              },
              {
                displayName: 'CC',
                name: 'cc',
                type: 'string',
                default: '',
                description:
                  'Carbon copy recipients. Comma-separated. All recipients will see CC addresses.',
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
                  'Custom email headers for advanced use cases like email threading or tracking',
              },
              {
                displayName: 'Reply To',
                name: 'replyTo',
                type: 'string',
                default: '',
                description:
                  'Email address where replies should be sent. Can be different from the sender address.',
              },
              {
                displayName: 'Scheduled At',
                name: 'scheduledAt',
                type: 'string',
                default: '',
                placeholder: 'in 1 hour',
                description:
                  'Schedule this email to be sent at a future time. Accepts natural language like "in 1 hour" or ISO 8601 format "2024-12-25T09:00:00Z". Each email in the batch can be scheduled independently.',
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
                  'Key-value tags for email categorization and analytics. Use for tracking campaigns or custom metadata.',
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
                  'Topic to scope this email to for subscription preference management. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
              },
            ],
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
                  'Send email with HTML content only. Plain text auto-generated.',
              },
              {
                name: 'HTML and Text',
                value: 'both',
                description: 'Send email with both HTML and custom plain text',
              },
              {
                name: 'Text',
                value: 'text',
                description: 'Send email with plain text content only',
              },
            ],
            default: 'html',
            description:
              'Choose the content format for your email. HTML recommended for rich formatting.',
          },
          {
            displayName: 'From',
            name: 'from',
            type: 'string',
            required: true,
            default: '',
            placeholder: 'you@example.com',
            description:
              'Sender email address. Must be from a verified domain. Format: "Name &lt;email@domain.com&gt;" or just email.',
          },
          {
            displayName: 'HTML Content',
            name: 'html',
            type: 'string',
            default: '',
            description:
              'HTML body of the email. Use for rich formatting, images, and links.',
            placeholder: '<p>Your HTML content here</p>',
          },
          {
            displayName: 'Subject',
            name: 'subject',
            type: 'string',
            required: true,
            default: '',
            placeholder: 'Hello from n8n!',
            description: 'Email subject line. Keep concise and descriptive.',
          },
          {
            displayName: 'Template Name or ID',
            name: 'templateId',
            type: 'options',
            default: '',
            typeOptions: {
              loadOptionsMethod: 'getTemplates',
            },
            description:
              'Template to use instead of HTML content. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
          },
          {
            displayName: 'Template Variables',
            name: 'templateVariables',
            type: 'fixedCollection',
            default: { variables: [] },
            typeOptions: {
              multipleValues: true,
            },
            description:
              'Key-value pairs to replace template placeholders. Keys must match the template variable names.',
            options: [
              {
                name: 'variables',
                displayName: 'Variable',
                values: [
                  {
                    displayName: 'Key',
                    name: 'key',
                    type: 'string',
                    required: true,
                    default: '',
                    description:
                      'Variable name as defined in the template (e.g., FIRST_NAME, PRODUCT_NAME)',
                  },
                  {
                    displayName: 'Value',
                    name: 'value',
                    type: 'string',
                    default: '',
                    description:
                      'The value to replace the variable placeholder with',
                  },
                ],
              },
            ],
          },
          {
            displayName: 'Text Content',
            name: 'text',
            type: 'string',
            default: '',
            description: 'Plain text content of the email',
            placeholder: 'Your plain text content here',
          },
          {
            displayName: 'To',
            name: 'to',
            type: 'string',
            required: true,
            default: '',
            placeholder: 'user@example.com',
            description:
              'Recipient email address (comma-separated for multiple)',
          },
          {
            displayName: 'Use Template',
            name: 'useTemplate',
            type: 'boolean',
            default: false,
            description:
              'Whether to send using a published template instead of HTML/Text content',
          },
        ],
      },
    ],
  },
  {
    displayName: 'Batch Options',
    name: 'batchOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['sendBatch'],
      },
    },
    options: [
      {
        displayName: 'Idempotency Key',
        name: 'idempotency_key',
        type: 'string',
        default: '',
        description:
          'Unique key to ensure the batch request is processed only once',
      },
      {
        displayName: 'Validation Mode',
        name: 'validation_mode',
        type: 'options',
        default: 'strict',
        options: [
          {
            name: 'Strict',
            value: 'strict',
            description:
              'Reject the entire batch if any email fails validation',
          },
          {
            name: 'Permissive',
            value: 'permissive',
            description: 'Send valid emails and return errors for invalid ones',
          },
        ],
        description: 'How Resend should validate the batch',
      },
    ],
  },
];

interface EmailInput {
  from: string;
  to: string;
  subject: string;
  useTemplate?: boolean;
  emailFormat?: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateVariables?: { variables?: Array<{ key: string; value?: unknown }> };
  additionalOptions?: {
    bcc?: string;
    cc?: string;
    headers?: { headers: Array<{ name: string; value?: string }> };
    replyTo?: string;
    scheduledAt?: string;
    tags?: { tags: Array<{ name: string; value?: string }> };
    topicId?: string;
  };
}

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const emailsData = this.getNodeParameter('emails', index) as {
    emails: EmailInput[];
  };
  const batchOptions = this.getNodeParameter('batchOptions', index, {}) as {
    idempotency_key?: string;
    validation_mode?: string;
  };

  const emails = emailsData.emails.map((email) => {
    const useTemplate = email.useTemplate ?? false;
    const emailFormat = email.emailFormat ?? 'html';
    const contentType = useTemplate ? 'template' : emailFormat;
    const additionalOptions = email.additionalOptions ?? {};

    const emailObj: Record<string, unknown> = {
      from: email.from,
      to: normalizeEmailList(email.to),
      subject: email.subject,
    };

    const ccValue = additionalOptions.cc;
    if (ccValue) {
      const ccList = normalizeEmailList(ccValue);
      if (ccList.length) {
        emailObj.cc = ccList;
      }
    }

    const bccValue = additionalOptions.bcc;
    if (bccValue) {
      const bccList = normalizeEmailList(bccValue);
      if (bccList.length) {
        emailObj.bcc = bccList;
      }
    }

    const replyToValue = additionalOptions.replyTo;
    if (replyToValue) {
      const replyToList = normalizeEmailList(replyToValue);
      if (replyToList.length) {
        emailObj.reply_to = replyToList;
      }
    }

    const headersInput = additionalOptions.headers;
    if (headersInput?.headers?.length) {
      const headers: Record<string, string> = {};
      for (const header of headersInput.headers) {
        if (header.name) {
          headers[header.name] = header.value ?? '';
        }
      }
      if (Object.keys(headers).length) {
        emailObj.headers = headers;
      }
    }

    const tagsInput = additionalOptions.tags;
    if (tagsInput?.tags?.length) {
      emailObj.tags = tagsInput.tags
        .filter((tag) => tag.name)
        .map((tag) => ({
          name: tag.name,
          value: tag.value ?? '',
        }));
    }

    const topicId = additionalOptions.topicId;
    if (topicId) {
      emailObj.topic_id = topicId;
    }

    const scheduledAt = additionalOptions.scheduledAt;
    if (scheduledAt) {
      emailObj.scheduled_at = scheduledAt;
    }

    if (contentType === 'template') {
      if (!email.templateId) {
        throw new NodeOperationError(
          this.getNode(),
          'Template Name or ID is required for batch emails when using templates.',
          { itemIndex: index },
        );
      }
      if (email.html || email.text) {
        throw new NodeOperationError(
          this.getNode(),
          'HTML/Text Content cannot be used when sending batch emails with templates.',
          { itemIndex: index },
        );
      }
      emailObj.template = { id: email.templateId };
      const variables = buildTemplateSendVariables(email.templateVariables);
      if (variables && Object.keys(variables).length) {
        (emailObj.template as Record<string, unknown>).variables = variables;
      }
    } else {
      if (contentType === 'html' || contentType === 'both') {
        if (!email.html) {
          throw new NodeOperationError(
            this.getNode(),
            'HTML Content is required for batch emails.',
            { itemIndex: index },
          );
        }
        emailObj.html = email.html;
      }

      if (contentType === 'text' || contentType === 'both') {
        if (!email.text) {
          throw new NodeOperationError(
            this.getNode(),
            'Text Content is required for batch emails.',
            { itemIndex: index },
          );
        }
        emailObj.text = email.text;
      }
    }

    return emailObj;
  });

  const qs: Record<string, string> = {};
  if (batchOptions.validation_mode) {
    qs.validation_mode = batchOptions.validation_mode;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (batchOptions.idempotency_key) {
    headers['Idempotency-Key'] = batchOptions.idempotency_key;
  }

  let response: IDataObject;
  try {
    response = await this.helpers.httpRequestWithAuthentication.call(
      this,
      getCredentialType(this),
      {
        url: `${RESEND_API_BASE}/emails/batch`,
        method: 'POST',
        headers,
        qs: Object.keys(qs).length ? qs : undefined,
        body: emails,
        json: true,
      },
    );
  } catch (error) {
    handleResendApiError(this.getNode(), error, index);
  }

  return [{ json: response, pairedItem: { item: index } }];
}
