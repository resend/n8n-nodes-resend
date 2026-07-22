import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  type ICredentialsDecrypted,
  type ICredentialTestFunctions,
  type IDataObject,
  type IHookFunctions,
  type IHttpRequestMethods,
  type INode,
  type INodeCredentialTestResult,
  type INodeType,
  type INodeTypeDescription,
  type IWebhookFunctions,
  type IWebhookResponseData,
  type JsonObject,
  NodeApiError,
  NodeConnectionTypes,
  NodeOperationError,
} from 'n8n-workflow';

const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

function getHeaderValue(
  headers: Record<string, unknown>,
  name: string,
): string {
  const exactMatch = headers[name];
  const titleCaseMatch =
    headers[
      name
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('-')
    ];
  const raw = exactMatch ?? titleCaseMatch;
  return ((Array.isArray(raw) ? raw[0] : raw) as string) || '';
}

function parseSvixTimestamp(timestamp: string): number | null {
  const numeric = Number(timestamp);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric > 1e12 ? numeric : numeric * 1000;
}

async function verifySvixSignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  webhookSigningSecret: string,
  node: INode,
): Promise<void> {
  const timestampMs = parseSvixTimestamp(svixTimestamp);
  if (
    !timestampMs ||
    Math.abs(Date.now() - timestampMs) > WEBHOOK_TOLERANCE_MS
  ) {
    throw new NodeOperationError(
      node,
      'Webhook signature timestamp is outside the allowed tolerance',
    );
  }

  const secret = webhookSigningSecret.replace(/^whsec_/, '');
  const secretBytes = Buffer.from(secret, 'base64');

  const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;
  const expectedSignature = createHmac('sha256', secretBytes)
    .update(signedPayload)
    .digest('base64');
  const expectedBytes = Buffer.from(expectedSignature, 'base64');

  const signatures = svixSignature.split(' ');

  for (const sig of signatures) {
    const [version, signature] = sig.split(',');
    if (version === 'v1') {
      const signatureBytes = Buffer.from(signature, 'base64');
      if (
        signatureBytes.length === expectedBytes.length &&
        timingSafeEqual(signatureBytes, expectedBytes)
      ) {
        return;
      }
    }
  }
  throw new NodeOperationError(node, 'Invalid webhook signature');
}

async function resendApiRequest(
  this: IHookFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body?: IDataObject,
): Promise<IDataObject> {
  return (await this.helpers.httpRequestWithAuthentication.call(
    this,
    'resendApi',
    {
      url: `https://api.resend.com${endpoint}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'n8n-nodes-resend',
      },
      json: true,
      ...(body ? { body } : {}),
    },
  )) as IDataObject;
}

function isNotFoundError(error: unknown): boolean {
  const e = error as {
    httpCode?: string | number;
    statusCode?: string | number;
    response?: { status?: number };
  };
  const code = e?.httpCode ?? e?.statusCode ?? e?.response?.status;
  return String(code) === '404';
}

async function hasResendApiCredential(
  context: IHookFunctions,
): Promise<boolean> {
  try {
    return Boolean(await context.getCredentials('resendApi'));
  } catch {
    return false;
  }
}

export class ResendTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Resend Trigger',
    name: 'resendTrigger',
    icon: {
      light: 'file:resend-icon-black.svg',
      dark: 'file:resend-icon-white.svg',
    },
    group: ['trigger'],
    version: 1,
    description:
      'Triggers workflows when Resend email events occur, such as email sent, delivered, opened, clicked, bounced, or complained. Includes secure webhook signature verification.',
    subtitle:
      '={{(() => { const events = $parameter["events"] ?? []; const actionLabels = { created: "create", deleted: "delete", updated: "update", sent: "send", opened: "open", clicked: "click", bounced: "bounce", complained: "complain", delivered: "deliver", delivery_delayed: "delay", failed: "fail", received: "receive", scheduled: "schedule", suppressed: "suppress" }; return events.map((event) => { const [resource, action] = event.split("."); if (!resource || !action) { return event; } const actionLabel = actionLabels[action] ?? action.replace(/_/g, " "); return actionLabel + ": " + resource; }).join(", "); })() }}',
    defaults: {
      name: 'Resend Trigger',
    },
    credentials: [
      {
        name: 'resendWebhookSigningSecretApi',
        required: false,
        testedBy: 'resendWebhookSigningSecretTest',
      },
      {
        name: 'resendApi',
        required: false,
      },
    ],
    triggerPanel: {
      header:
        'Add a Resend API credential to register this webhook automatically, or copy the webhook URL below and paste it into your Resend dashboard webhook configuration.',
      executionsHelp: {
        inactive:
          'Webhooks have two modes: test and production.<br><br><b>Use test mode while you build your workflow</b>. Click the "Listen for test event" button, then paste the test URL into your Resend webhook configuration. The webhook executions will show up in the editor.<br><br><b>Use production mode to run your workflow automatically</b>. Activate the workflow, then paste the production URL into your Resend webhook configuration. These executions will show up in the executions list, but not in the editor.',
        active:
          'Webhooks have two modes: test and production.<br><br><b>Use test mode while you build your workflow</b>. Click the "Listen for test event" button, then paste the test URL into your Resend webhook configuration. The webhook executions will show up in the editor.<br><br><b>Use production mode to run your workflow automatically</b>. Since the workflow is activated, you can paste the production URL into your Resend webhook configuration. These executions will show up in the executions list, but not in the editor.',
      },
      activationHint:
        "Once you've finished building your workflow, activate it to use the production webhook URL in your Resend dashboard.",
    },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: '={{$parameter["path"]}}',
        isFullPath: true,
      },
    ],
    properties: [
      {
        displayName: 'Path',
        name: 'path',
        type: 'string',
        default: 'resend',
        placeholder: 'resend',
        required: true,
        description:
          'The path for the webhook URL. This will completely replace the UUID segment in the webhook URL. For example, if you set this to "test1", your webhook URL will be https://your-n8n-domain/webhook-test/test1',
      },
      {
        displayName: 'Events',
        name: 'events',
        type: 'multiOptions',
        required: true,
        default: ['email.sent'],
        options: [
          { name: 'Contact Created', value: 'contact.created' },
          { name: 'Contact Deleted', value: 'contact.deleted' },
          { name: 'Contact Updated', value: 'contact.updated' },
          { name: 'Domain Created', value: 'domain.created' },
          { name: 'Domain Deleted', value: 'domain.deleted' },
          { name: 'Domain Updated', value: 'domain.updated' },
          { name: 'Email Bounced', value: 'email.bounced' },
          { name: 'Email Clicked', value: 'email.clicked' },
          { name: 'Email Complained', value: 'email.complained' },
          { name: 'Email Delivered', value: 'email.delivered' },
          { name: 'Email Delivery Delayed', value: 'email.delivery_delayed' },
          { name: 'Email Failed', value: 'email.failed' },
          { name: 'Email Opened', value: 'email.opened' },
          { name: 'Email Received', value: 'email.received' },
          { name: 'Email Scheduled', value: 'email.scheduled' },
          { name: 'Email Sent', value: 'email.sent' },
          { name: 'Email Suppressed', value: 'email.suppressed' },
        ],
        description: 'Select the Resend event types to listen for',
      },
    ],
    usableAsTool: true,
  };

  methods = {
    credentialTest: {
      async resendWebhookSigningSecretTest(
        this: ICredentialTestFunctions,
        credential: ICredentialsDecrypted,
      ): Promise<INodeCredentialTestResult> {
        const secret =
          typeof credential.data?.webhookSigningSecret === 'string'
            ? credential.data.webhookSigningSecret.trim()
            : '';
        if (!secret.startsWith('whsec_')) {
          return {
            status: 'Error',
            message:
              'Signing secret must start with "whsec_". Copy it from the webhook settings page in your Resend dashboard.',
          };
        }
        const encoded = secret.slice('whsec_'.length);
        if (!encoded || Buffer.from(encoded, 'base64').length === 0) {
          return {
            status: 'Error',
            message: 'Signing secret is not valid base64',
          };
        }
        return { status: 'OK', message: 'Signing secret format is valid' };
      },
    },
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        if (!(await hasResendApiCredential(this))) {
          return true;
        }
        const webhookData = this.getWorkflowStaticData('node');
        if (!webhookData.webhookId) {
          return false;
        }
        try {
          await resendApiRequest.call(
            this,
            'GET',
            `/webhooks/${webhookData.webhookId}`,
          );
          return true;
        } catch (error) {
          if (isNotFoundError(error)) {
            delete webhookData.webhookId;
            delete webhookData.webhookSigningSecret;
            return false;
          }
          throw new NodeApiError(this.getNode(), error as JsonObject);
        }
      },
      async create(this: IHookFunctions): Promise<boolean> {
        if (!(await hasResendApiCredential(this))) {
          return true;
        }
        const webhookUrl = this.getNodeWebhookUrl('default');
        const events = this.getNodeParameter('events') as string[];
        const response = await resendApiRequest.call(
          this,
          'POST',
          '/webhooks',
          {
            endpoint: webhookUrl,
            events,
          },
        );
        const webhookId =
          (response.id as string | undefined) ??
          ((response.data as IDataObject | undefined)?.id as
            | string
            | undefined);
        if (!webhookId) {
          throw new NodeOperationError(
            this.getNode(),
            'Resend did not return a webhook ID when creating the webhook',
          );
        }
        const signingSecret =
          (response.signing_secret as string | undefined) ??
          ((response.data as IDataObject | undefined)?.signing_secret as
            | string
            | undefined);
        const webhookData = this.getWorkflowStaticData('node');
        webhookData.webhookId = webhookId;
        if (signingSecret) {
          webhookData.webhookSigningSecret = signingSecret;
        }
        return true;
      },
      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node');
        if (!webhookData.webhookId) {
          return true;
        }
        if (await hasResendApiCredential(this)) {
          try {
            await resendApiRequest.call(
              this,
              'DELETE',
              `/webhooks/${webhookData.webhookId}`,
            );
          } catch (error) {
            if (!isNotFoundError(error)) {
              throw new NodeApiError(this.getNode(), error as JsonObject);
            }
          }
        }
        delete webhookData.webhookId;
        delete webhookData.webhookSigningSecret;
        return true;
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const bodyData = this.getBodyData();
    const headers = this.getHeaderData();
    const request = this.getRequestObject();
    const subscribedEvents = this.getNodeParameter('events') as string[];
    const webhookData = this.getWorkflowStaticData('node');
    let webhookSigningSecret =
      typeof webhookData.webhookSigningSecret === 'string'
        ? webhookData.webhookSigningSecret
        : '';
    if (!webhookSigningSecret) {
      try {
        const credentials = await this.getCredentials(
          'resendWebhookSigningSecretApi',
        );
        webhookSigningSecret =
          (credentials.webhookSigningSecret as string | undefined) ?? '';
      } catch {
        webhookSigningSecret = '';
      }
    }
    if (!webhookSigningSecret || webhookSigningSecret.trim() === '') {
      const res = this.getResponseObject();
      res
        .status(401)
        .json({ error: 'Webhook signing secret is not configured' });
      return {
        noWebhookResponse: true,
      };
    }
    try {
      const rawBody =
        (request as { rawBody?: unknown }).rawBody ??
        (request as { body?: unknown }).body;
      const payload =
        typeof rawBody === 'string'
          ? rawBody
          : Buffer.isBuffer(rawBody)
            ? rawBody.toString('utf8')
            : JSON.stringify(bodyData ?? {});

      const svixId = getHeaderValue(headers, 'svix-id');
      const svixTimestamp = getHeaderValue(headers, 'svix-timestamp');
      const svixSignature = getHeaderValue(headers, 'svix-signature');

      if (!svixId || !svixTimestamp || !svixSignature) {
        const res = this.getResponseObject();
        res.status(401).json({ error: 'Missing Svix signature headers' });
        return {
          noWebhookResponse: true,
        };
      }

      await verifySvixSignature(
        payload,
        svixId,
        svixTimestamp,
        svixSignature,
        webhookSigningSecret,
        this.getNode(),
      );
    } catch {
      const res = this.getResponseObject();
      res.status(401).json({ error: 'Invalid webhook signature' });
      return {
        noWebhookResponse: true,
      };
    }

    if (!bodyData || typeof bodyData !== 'object' || !('type' in bodyData)) {
      return {
        noWebhookResponse: true,
      };
    }

    const eventType = (bodyData as { type: string }).type;

    if (subscribedEvents.includes(eventType)) {
      return {
        workflowData: [this.helpers.returnJsonArray([bodyData])],
      };
    }
    return {
      noWebhookResponse: true,
    };
  }
}
