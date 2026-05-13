import type {
  IDataObject,
  IExecuteFunctions,
  INodeProperties,
  IWebhookFunctions,
} from 'n8n-workflow';
import {
  ApplicationError,
  NodeOperationError,
  SEND_AND_WAIT_OPERATION,
  updateDisplayOptions,
  WAIT_INDEFINITELY,
} from 'n8n-workflow';
import { handleResendApiError, RESEND_API_BASE } from '../../transport';
import { limitWaitTimeOption } from './descriptions';
import {
  ACTION_RECORDED_PAGE,
  BUTTON_STYLE_PRIMARY,
  BUTTON_STYLE_SECONDARY,
  createEmailBody,
} from './email-templates';
import type { IEmail, SendAndWaitConfig } from './interfaces';

const appendAttributionOption: INodeProperties = {
  displayName: 'Append N8n Attribution',
  name: 'appendAttribution',
  type: 'boolean',
  default: true,
  description:
    'Whether to include the phrase "This message was sent automatically with n8n" to the end of the message',
};

// HTML escape helper
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Operation Properties ----------------------------------------------------------
export function getSendAndWaitProperties(
  targetProperties: INodeProperties[],
  resource: string | null = 'email',
  additionalProperties: INodeProperties[] = [],
  options?: {
    noButtonStyle?: boolean;
    defaultApproveLabel?: string;
    defaultDisapproveLabel?: string;
    extraOptions?: INodeProperties[];
  },
): INodeProperties[] {
  const buttonStyle: INodeProperties = {
    displayName: 'Button Style',
    name: 'buttonStyle',
    type: 'options',
    default: 'primary',
    options: [
      {
        name: 'Primary',
        value: 'primary',
      },
      {
        name: 'Secondary',
        value: 'secondary',
      },
    ],
  };

  const approvalOptionsValues = [
    {
      displayName: 'Type of Approval',
      name: 'approvalType',
      type: 'options',
      placeholder: 'Add option',
      default: 'single',
      options: [
        {
          name: 'Approve Only',
          value: 'single',
        },
        {
          name: 'Approve and Disapprove',
          value: 'double',
        },
      ],
    },
    {
      displayName: 'Approve Button Label',
      name: 'approveLabel',
      type: 'string',
      default: options?.defaultApproveLabel || 'Approve',
      displayOptions: {
        show: {
          approvalType: ['single', 'double'],
        },
      },
    },
    ...[
      options?.noButtonStyle
        ? ({} as INodeProperties)
        : {
            ...buttonStyle,
            displayName: 'Approve Button Style',
            name: 'buttonApprovalStyle',
            displayOptions: {
              show: {
                approvalType: ['single', 'double'],
              },
            },
          },
    ],
    {
      displayName: 'Disapprove Button Label',
      name: 'disapproveLabel',
      type: 'string',
      default: options?.defaultDisapproveLabel || 'Decline',
      displayOptions: {
        show: {
          approvalType: ['double'],
        },
      },
    },
    ...[
      options?.noButtonStyle
        ? ({} as INodeProperties)
        : {
            ...buttonStyle,
            displayName: 'Disapprove Button Style',
            name: 'buttonDisapprovalStyle',
            default: 'secondary',
            displayOptions: {
              show: {
                approvalType: ['double'],
              },
            },
          },
    ],
  ].filter((p) => Object.keys(p).length) as INodeProperties[];

  const sendAndWait: INodeProperties[] = [
    ...targetProperties,
    {
      displayName: 'Subject',
      name: 'subject',
      type: 'string',
      default: '',
      required: true,
      placeholder: 'e.g. Approval required',
    },
    {
      displayName: 'Message',
      name: 'message',
      type: 'string',
      default: '',
      required: true,
      typeOptions: {
        rows: 4,
      },
    },
    {
      displayName: 'Response Type',
      name: 'responseType',
      type: 'options',
      default: 'approval',
      options: [
        {
          name: 'Approval',
          value: 'approval',
          description: 'User can approve/disapprove from within the message',
        },
        {
          name: 'Free Text',
          value: 'freeText',
          description: 'User can submit a response via a form',
        },
      ],
    },
    {
      displayName: 'Approval Options',
      name: 'approvalOptions',
      type: 'fixedCollection',
      placeholder: 'Add option',
      default: {},
      options: [
        {
          displayName: 'Values',
          name: 'values',
          values: approvalOptionsValues,
        },
      ],
      displayOptions: {
        show: {
          responseType: ['approval'],
        },
      },
    },
    {
      displayName: 'Options',
      name: 'options',
      type: 'collection',
      placeholder: 'Add option',
      default: {},
      options: [
        limitWaitTimeOption,
        appendAttributionOption,
        ...(options?.extraOptions ?? []),
      ],
      displayOptions: {
        show: {
          responseType: ['approval'],
        },
      },
    },
    {
      displayName: 'Options',
      name: 'options',
      type: 'collection',
      placeholder: 'Add option',
      default: {},
      options: [
        {
          displayName: 'Message Button Label',
          name: 'messageButtonLabel',
          type: 'string',
          default: 'Respond',
        },
        {
          displayName: 'Response Form Title',
          name: 'responseFormTitle',
          description:
            'Title of the form that the user can access to provide their response',
          type: 'string',
          default: '',
        },
        {
          displayName: 'Response Form Description',
          name: 'responseFormDescription',
          description:
            'Description of the form that the user can access to provide their response',
          type: 'string',
          default: '',
        },
        {
          displayName: 'Response Form Button Label',
          name: 'responseFormButtonLabel',
          type: 'string',
          default: 'Submit',
        },
        limitWaitTimeOption,
        appendAttributionOption,
        ...(options?.extraOptions ?? []),
      ],
      displayOptions: {
        show: {
          responseType: ['freeText'],
        },
      },
    },
    ...additionalProperties,
  ];

  return updateDisplayOptions(
    {
      show: {
        ...(resource ? { resource: [resource] } : {}),
        operation: [SEND_AND_WAIT_OPERATION],
      },
    },
    sendAndWait,
  );
}

// Webhook Function --------------------------------------------------------------
const getFormResponseCustomizations = (context: IWebhookFunctions) => {
  const message = context.getNodeParameter('message', '') as string;
  const options = context.getNodeParameter('options', {}) as {
    messageButtonLabel?: string;
    responseFormTitle?: string;
    responseFormDescription?: string;
    responseFormButtonLabel?: string;
  };

  let formTitle = '';
  if (options.responseFormTitle) {
    formTitle = options.responseFormTitle;
  }

  let formDescription = message;
  if (options.responseFormDescription) {
    formDescription = options.responseFormDescription;
  }
  formDescription = formDescription
    .replace(/\\n/g, '\n')
    .replace(/<br>/g, '\n');

  let buttonLabel = 'Submit';
  if (options.responseFormButtonLabel) {
    buttonLabel = options.responseFormButtonLabel;
  }

  return {
    formTitle,
    formDescription,
    buttonLabel,
  };
};

// Simple form HTML for free text response
function createFreeTextFormPage(
  formTitle: string,
  formDescription: string,
  buttonLabel: string,
  actionUrl: string,
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${formTitle || 'Submit Response'}</title>
	<style>
		*, ::after, ::before { box-sizing: border-box; margin: 0; padding: 0; }
		body {
			font-family: 'Open Sans', Arial, sans-serif;
			font-size: 14px;
			background-color: #FBFCFE;
			display: flex;
			justify-content: center;
			padding: 24px;
		}
		.container {
			width: 100%;
			max-width: 448px;
		}
		.card {
			background-color: white;
			border: 1px solid #DBDFE7;
			border-radius: 8px;
			box-shadow: 0px 4px 16px rgba(99, 77, 255, 0.06);
			padding: 24px;
		}
		h1 {
			color: #525356;
			font-size: 20px;
			font-weight: 400;
			margin-bottom: 16px;
		}
		.description {
			color: #7E8186;
			margin-bottom: 16px;
			white-space: pre-line;
		}
		textarea {
			width: 100%;
			min-height: 120px;
			padding: 12px;
			border: 1px solid #DBDFE7;
			border-radius: 6px;
			font-family: inherit;
			font-size: 14px;
			resize: vertical;
			margin-bottom: 16px;
		}
		textarea:focus {
			outline: none;
			border-color: #ff6d5a;
		}
		button {
			display: inline-block;
			background-color: #ff6d5a;
			color: white;
			padding: 12px 24px;
			font-family: inherit;
			font-size: 14px;
			font-weight: 600;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			min-width: 120px;
		}
		button:hover {
			background-color: #e55a48;
		}
		.n8n-link {
			text-align: center;
			margin-top: 16px;
		}
		.n8n-link a {
			color: #7E8186;
			font-size: 12px;
			text-decoration: none;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="card">
			${formTitle ? `<h1>${escapeHtml(formTitle)}</h1>` : ''}
			${formDescription ? `<div class="description">${escapeHtml(formDescription)}</div>` : ''}
			<form method="POST" action="${actionUrl}">
				<textarea name="response" placeholder="Enter your response..." required></textarea>
				<button type="submit">${escapeHtml(buttonLabel)}</button>
			</form>
		</div>
		<div class="n8n-link">
			<a href="https://n8n.io/?utm_source=n8n-internal&utm_medium=send-and-wait" target="_blank">
				Automated with n8n
			</a>
		</div>
	</div>
</body>
</html>
	`;
}

export async function sendAndWaitWebhook(this: IWebhookFunctions) {
  const method = this.getRequestObject().method;
  const res = this.getResponseObject();
  const req = this.getRequestObject();

  const responseType = this.getNodeParameter('responseType', 'approval') as
    | 'approval'
    | 'freeText';

  if (responseType === 'freeText') {
    if (method === 'GET') {
      const { formTitle, formDescription, buttonLabel } =
        getFormResponseCustomizations(this);
      const webhookUrl = this.getNodeWebhookUrl('default') as string;

      const formPage = createFreeTextFormPage(
        formTitle,
        formDescription,
        buttonLabel,
        webhookUrl,
      );

      res.setHeader('Content-Type', 'text/html');
      res.send(formPage);

      return {
        noWebhookResponse: true,
      };
    }
    if (method === 'POST') {
      const body = req.body as { response?: string };
      const responseText = body.response || '';

      res.setHeader('Content-Type', 'text/html');
      res.send(ACTION_RECORDED_PAGE);

      return {
        webhookResponse: undefined,
        workflowData: [[{ json: { data: { text: responseText } } }]],
      };
    }
  }

  const query = req.query as { approved: 'false' | 'true' };
  const approved = query.approved === 'true';

  res.setHeader('Content-Type', 'text/html');
  res.send(ACTION_RECORDED_PAGE);

  return {
    webhookResponse: undefined,
    workflowData: [[{ json: { data: { approved } } }]],
  };
}

// Send and Wait Config -----------------------------------------------------------
export function getSendAndWaitConfig(
  context: IExecuteFunctions,
): SendAndWaitConfig {
  const message = escapeHtml(
    (context.getNodeParameter('message', 0, '') as string).trim(),
  )
    .replace(/\\n/g, '\n')
    .replace(/<br>/g, '\n');
  const subject = escapeHtml(
    context.getNodeParameter('subject', 0, '') as string,
  );
  const approvalOptions = context.getNodeParameter(
    'approvalOptions.values',
    0,
    {},
  ) as {
    approvalType?: 'single' | 'double';
    approveLabel?: string;
    buttonApprovalStyle?: string;
    disapproveLabel?: string;
    buttonDisapprovalStyle?: string;
  };

  const options = context.getNodeParameter('options', 0, {}) as {
    appendAttribution?: boolean;
  };

  const config: SendAndWaitConfig = {
    title: subject,
    message,
    options: [],
    appendAttribution: options?.appendAttribution,
  };

  const responseType = context.getNodeParameter(
    'responseType',
    0,
    'approval',
  ) as string;

  const approvedSignedResumeUrl = context.getSignedResumeUrl({
    approved: 'true',
  });

  if (responseType === 'freeText') {
    const label = escapeHtml(
      context.getNodeParameter(
        'options.messageButtonLabel',
        0,
        'Respond',
      ) as string,
    );
    config.options.push({
      label,
      url: approvedSignedResumeUrl,
      style: 'primary',
    });
  } else if (approvalOptions.approvalType === 'double') {
    const approveLabel = escapeHtml(approvalOptions.approveLabel || 'Approve');
    const buttonApprovalStyle =
      approvalOptions.buttonApprovalStyle || 'primary';
    const disapproveLabel = escapeHtml(
      approvalOptions.disapproveLabel || 'Disapprove',
    );
    const buttonDisapprovalStyle =
      approvalOptions.buttonDisapprovalStyle || 'secondary';
    const disapprovedSignedResumeUrl = context.getSignedResumeUrl({
      approved: 'false',
    });

    config.options.push({
      label: disapproveLabel,
      url: disapprovedSignedResumeUrl,
      style: buttonDisapprovalStyle,
    });
    config.options.push({
      label: approveLabel,
      url: approvedSignedResumeUrl,
      style: buttonApprovalStyle,
    });
  } else {
    const label = escapeHtml(approvalOptions.approveLabel || 'Approve');
    const style = approvalOptions.buttonApprovalStyle || 'primary';
    config.options.push({
      label,
      url: approvedSignedResumeUrl,
      style,
    });
  }

  return config;
}

export function createButton(url: string, label: string, style: string) {
  let buttonStyle = BUTTON_STYLE_PRIMARY;
  if (style === 'secondary') {
    buttonStyle = BUTTON_STYLE_SECONDARY;
  }
  return `<a href="${url}" target="_blank" style="${buttonStyle}">${label}</a>`;
}

export function createEmail(context: IExecuteFunctions): IEmail {
  const to = (context.getNodeParameter('sendTo', 0, '') as string).trim();
  const from = (context.getNodeParameter('sendFrom', 0, '') as string).trim();
  const config = getSendAndWaitConfig(context);

  if (to.indexOf('@') === -1 || (to.match(/@/g) || []).length > 1) {
    const description = `The email address '${to}' in the 'To' field isn't valid or contains multiple addresses. Please provide only a single email address.`;
    throw new NodeOperationError(context.getNode(), 'Invalid email address', {
      description,
      itemIndex: 0,
    });
  }

  if (!from || from.indexOf('@') === -1) {
    throw new NodeOperationError(
      context.getNode(),
      'Invalid sender email address',
      {
        description: `The email address '${from}' in the 'From' field isn't valid.`,
        itemIndex: 0,
      },
    );
  }

  const buttons: string[] = [];
  for (const option of config.options) {
    buttons.push(createButton(option.url, option.label, option.style));
  }

  let emailBody: string;
  if (config.appendAttribution !== false) {
    const instanceId = context.getInstanceId();
    emailBody = createEmailBody(config.message, buttons.join('\n'), {
      instanceId: instanceId ?? '',
    });
  } else {
    emailBody = createEmailBody(config.message, buttons.join('\n'));
  }

  const email: IEmail = {
    from,
    to,
    subject: config.title,
    body: '',
    htmlBody: emailBody,
  };

  return email;
}

const sendAndWaitWaitingTooltip = (parameters: { operation: string }) => {
  if (parameters?.operation === 'sendAndWait') {
    return "Execution will continue after the user's response";
  }
  return '';
};

export const SEND_AND_WAIT_WAITING_TOOLTIP = `={{ (${sendAndWaitWaitingTooltip})($parameter) }}`;

// Configure wait till date
export function configureWaitTillDate(
  context: IExecuteFunctions,
  location: 'options' | 'root' = 'options',
) {
  let waitTill = WAIT_INDEFINITELY;
  let limitOptions: IDataObject = {};

  if (location === 'options') {
    limitOptions = context.getNodeParameter(
      'options.limitWaitTime.values',
      0,
      {},
    ) as {
      limitType?: string;
      resumeAmount?: number;
      resumeUnit?: string;
      maxDateAndTime?: string;
    };
  } else {
    const limitWaitTime = context.getNodeParameter('limitWaitTime', 0, false);
    if (limitWaitTime) {
      limitOptions.limitType = context.getNodeParameter(
        'limitType',
        0,
        'afterTimeInterval',
      );

      if (limitOptions.limitType === 'afterTimeInterval') {
        limitOptions.resumeAmount = context.getNodeParameter(
          'resumeAmount',
          0,
          1,
        ) as number;
        limitOptions.resumeUnit = context.getNodeParameter(
          'resumeUnit',
          0,
          'hours',
        );
      } else {
        limitOptions.maxDateAndTime = context.getNodeParameter(
          'maxDateAndTime',
          0,
          '',
        );
      }
    }
  }

  if (Object.keys(limitOptions).length) {
    try {
      if (limitOptions.limitType === 'afterTimeInterval') {
        let waitAmount = limitOptions.resumeAmount as number;

        if (limitOptions.resumeUnit === 'minutes') {
          waitAmount *= 60;
        }
        if (limitOptions.resumeUnit === 'hours') {
          waitAmount *= 60 * 60;
        }
        if (limitOptions.resumeUnit === 'days') {
          waitAmount *= 60 * 60 * 24;
        }

        waitAmount *= 1000;
        waitTill = new Date(Date.now() + waitAmount);
      } else {
        waitTill = new Date(limitOptions.maxDateAndTime as string);
      }

      if (Number.isNaN(waitTill.getTime())) {
        throw new ApplicationError('Invalid date format');
      }
    } catch (error) {
      throw new NodeOperationError(
        context.getNode(),
        'Could not configure Limit Wait Time',
        {
          description: (error as Error).message,
        },
      );
    }
  }

  return waitTill;
}

// Send email via Resend API
export async function sendResendEmail(
  context: IExecuteFunctions,
  email: IEmail,
): Promise<void> {
  const requestBody: Record<string, unknown> = {
    from: email.from,
    to: email.to,
    subject: email.subject,
    html: email.htmlBody,
  };

  if (email.cc) {
    requestBody.cc = email.cc;
  }

  if (email.bcc) {
    requestBody.bcc = email.bcc;
  }

  if (email.replyTo) {
    requestBody.reply_to = email.replyTo;
  }

  try {
    await context.helpers.httpRequestWithAuthentication.call(
      context,
      'resendApi',
      {
        url: `${RESEND_API_BASE}/emails`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
        json: true,
      },
    );
  } catch (error) {
    handleResendApiError(context.getNode(), error);
  }
}
