import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import {
  apiRequest,
  normalizeEmailList,
  parseTemplateVariables,
} from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Name',
    name: 'templateName',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'order-confirmation',
    displayOptions: {
      show: {
        resource: ['templates'],
        operation: ['create'],
      },
    },
    description:
      'A descriptive name for the template (e.g., order-confirmation, welcome-email). Used for identification in the template list.',
  },
  {
    displayName: 'From',
    name: 'templateFrom',
    type: 'string',
    default: '',
    placeholder: 'Resend Store <store@resend.com>',
    displayOptions: {
      show: {
        resource: ['templates'],
        operation: ['create'],
      },
    },
    description:
      'Default sender email address for emails using this template. Must be from a verified domain. Format: "Display Name &lt;email@domain.com&gt;".',
  },
  {
    displayName: 'Subject',
    name: 'templateSubject',
    type: 'string',
    default: '',
    placeholder: 'Thanks for your order!',
    displayOptions: {
      show: {
        resource: ['templates'],
        operation: ['create'],
      },
    },
    description:
      'Default subject line for emails using this template. Can include template variables like {{{PRODUCT_NAME}}}.',
  },
  {
    displayName: 'HTML Content',
    name: 'templateHtml',
    type: 'string',
    required: true,
    default: '',
    typeOptions: {
      multiline: true,
      rows: 4,
    },
    placeholder: '<p>Name: {{{PRODUCT}}}</p><p>Total: {{{PRICE}}}</p>',
    displayOptions: {
      show: {
        resource: ['templates'],
        operation: ['create'],
      },
    },
    description:
      'HTML content of the template. Use {{{VARIABLE|fallback}}} syntax for dynamic content. Variables are replaced when sending emails.',
  },
  {
    displayName: 'Template Variables',
    name: 'templateVariables',
    type: 'fixedCollection',
    default: { variables: [] },
    typeOptions: {
      multipleValues: true,
    },
    displayOptions: {
      show: {
        resource: ['templates'],
        operation: ['create'],
      },
    },
    description:
      'Define template variables that will be replaced when sending emails. Use uppercase names (e.g., PRODUCT, PRICE) for consistency.',
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
              'Variable name used in the template with {{{NAME}}} syntax. Recommend using uppercase (e.g., PRODUCT, CUSTOMER_NAME).',
          },
          {
            displayName: 'Type',
            name: 'type',
            type: 'options',
            default: 'string',
            options: [
              { name: 'String', value: 'string' },
              { name: 'Number', value: 'number' },
            ],
            description:
              'The data type of the variable. Use Number for prices, quantities, or other numeric values.',
          },
          {
            displayName: 'Fallback Value',
            name: 'fallbackValue',
            type: 'string',
            default: '',
            description:
              'Default value displayed when the variable is not provided when sending the email. Use {{{VAR|fallback}}} in HTML.',
          },
        ],
      },
    ],
  },
  {
    displayName: 'Additional Fields',
    name: 'templateCreateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['templates'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Alias',
        name: 'alias',
        type: 'string',
        default: '',
        description:
          'A human-readable shortcut to reference the template instead of its ID',
      },
      {
        displayName: 'Reply To',
        name: 'replyTo',
        type: 'string',
        default: '',
        description:
          'Default reply-to email address. For multiple addresses, use comma-separated values.',
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
        description:
          'Plain text version of the template. If omitted, it is generated from the HTML.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const name = this.getNodeParameter('templateName', index) as string;
  const from = this.getNodeParameter('templateFrom', index, '') as string;
  const subject = this.getNodeParameter('templateSubject', index, '') as string;
  const html = this.getNodeParameter('templateHtml', index) as string;
  const templateVariables = this.getNodeParameter('templateVariables', index, {
    variables: [],
  }) as {
    variables: Array<{ key: string; type: string; fallbackValue?: unknown }>;
  };
  const createFields = this.getNodeParameter(
    'templateCreateFields',
    index,
    {},
  ) as {
    alias?: string;
    replyTo?: string;
    text?: string;
  };

  const body: IDataObject = {
    name,
    html,
  };
  if (from) {
    body.from = from;
  }
  if (subject) {
    body.subject = subject;
  }
  if (createFields.alias) {
    body.alias = createFields.alias;
  }
  if (createFields.replyTo) {
    const replyTo = normalizeEmailList(createFields.replyTo);
    if (replyTo.length) {
      body.reply_to = replyTo;
    }
  }
  if (createFields.text !== undefined) {
    body.text = createFields.text;
  }

  const variables = parseTemplateVariables(
    this,
    templateVariables,
    'fallback_value',
    index,
  );
  if (variables) {
    body.variables = variables;
  }

  const response = await apiRequest.call(this, 'POST', '/templates', body);

  return [{ json: response, pairedItem: { item: index } }];
}
