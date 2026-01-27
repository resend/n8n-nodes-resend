import {
	IHookFunctions,
	IWebhookFunctions,
	IWebhookResponseData,
	INode,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { createHmac, timingSafeEqual } from 'crypto';

const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

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
	if (!timestampMs || Math.abs(Date.now() - timestampMs) > WEBHOOK_TOLERANCE_MS) {
		throw new NodeOperationError(
			node,
			'Webhook signature timestamp is outside the allowed tolerance',
		);
	}

	// Remove the "whsec_" prefix from the secret
	const secret = webhookSigningSecret.replace(/^whsec_/, '');
	const secretBytes = Buffer.from(secret, 'base64');

	// Create the signed payload: "id.timestamp.payload"
	const signedPayload = `${svixId}.${svixTimestamp}.${payload}`;
	const expectedSignature = createHmac('sha256', secretBytes)
		.update(signedPayload)
		.digest('base64');
	const expectedBytes = Buffer.from(expectedSignature, 'base64');

	// Parse signatures from the header (format: "v1,signature1 v1,signature2")
	const signatures = svixSignature.split(' ');

	for (const sig of signatures) {
		const [version, signature] = sig.split(',');
		if (version === 'v1') {
			const signatureBytes = Buffer.from(signature, 'base64');
			if (
				signatureBytes.length === expectedBytes.length &&
				timingSafeEqual(signatureBytes, expectedBytes)
			) {
				return; // Signature is valid
			}
		}
	}
	throw new NodeOperationError(node, 'Invalid webhook signature');
}

export class ResendTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Resend Trigger',
		name: 'resendTrigger',
		icon: 'file:resend-icon-white.svg',
		group: ['trigger'],
		version: 1,
		description:
			'Triggers workflows when Resend email events occur, such as email sent, delivered, opened, clicked, bounced, or complained. Includes secure webhook signature verification.',
		subtitle:
			'={{(() => { const events = $parameter["events"] ?? []; const actionLabels = { created: "create", deleted: "delete", updated: "update", sent: "send", opened: "open", clicked: "click", bounced: "bounce", complained: "complain", delivered: "deliver", delivery_delayed: "delay" }; return events.map((event) => { const [resource, action] = event.split("."); if (!resource || !action) { return event; } const actionLabel = actionLabels[action] ?? action.replace(/_/g, " "); return actionLabel + ": " + resource; }).join(", "); })() }}',
		defaults: {
			name: 'Resend Trigger',
		},
		triggerPanel: {
			header:
				'Copy the webhook URL below and paste it into your Resend dashboard webhook configuration.',
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
		outputs: ['main' as NodeConnectionType],
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
				displayName: 'Webhook Signing Secret',
				name: 'webhookSigningSecret',
				type: 'string',
				placeholder: 'whsec_...',
				required: true,
				typeOptions: { password: true },

				default: '',
				description: 'Found in your Resend webhook configuration page (whsec_... value).',
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
					{ name: 'Email Opened', value: 'email.opened' },
					{ name: 'Email Sent', value: 'email.sent' },
				],
				description: 'Select the Resend event types to listen for',
			},
		],
	};
	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const headers = this.getHeaderData();
		const request = this.getRequestObject();
		const subscribedEvents = this.getNodeParameter('events') as string[];
		const webhookSigningSecret = this.getNodeParameter('webhookSigningSecret') as string;
		// Verify webhook signature if secret is provided
		if (webhookSigningSecret && webhookSigningSecret.trim() !== '') {
			try {
				// Get the raw body for signature verification
				const rawBody =
					(request as { rawBody?: unknown }).rawBody ?? (request as { body?: unknown }).body;
				const payload =
					typeof rawBody === 'string'
						? rawBody
						: Buffer.isBuffer(rawBody)
							? rawBody.toString('utf8')
							: JSON.stringify(bodyData ?? {});

				// Extract Svix headers with proper type handling
				const svixId =
					(Array.isArray(headers['svix-id']) ? headers['svix-id'][0] : headers['svix-id']) ||
					(Array.isArray(headers['Svix-Id']) ? headers['Svix-Id'][0] : headers['Svix-Id']) ||
					'';
				const svixTimestamp =
					(Array.isArray(headers['svix-timestamp'])
						? headers['svix-timestamp'][0]
						: headers['svix-timestamp']) ||
					(Array.isArray(headers['Svix-Timestamp'])
						? headers['Svix-Timestamp'][0]
						: headers['Svix-Timestamp']) ||
					'';
				const svixSignature =
					(Array.isArray(headers['svix-signature'])
						? headers['svix-signature'][0]
						: headers['svix-signature']) ||
					(Array.isArray(headers['Svix-Signature'])
						? headers['Svix-Signature'][0]
						: headers['Svix-Signature']) ||
					'';

				if (!svixId || !svixTimestamp || !svixSignature) {
					console.error('Missing required Svix headers for webhook verification');
					return {
						workflowData: [[]],
					};
				}

				// Verify the webhook signature
				await verifySvixSignature(
					payload,
					svixId,
					svixTimestamp,
					svixSignature,
					webhookSigningSecret,
					this.getNode(),
				);
			} catch (error) {
				// Signature verification failed
				console.error('Resend webhook signature verification failed:', error);
				return {
					workflowData: [[]],
				};
			}
		}

		if (!bodyData || typeof bodyData !== 'object' || !('type' in bodyData)) {
			// Resend should always send a JSON object with a 'type' field
			console.warn('Received webhook data that was not in the expected format.');
			return {
				workflowData: [[]],
			};
		}

		const eventType = (bodyData as { type: string }).type;

		if (subscribedEvents.includes(eventType)) {
			return {
				workflowData: [this.helpers.returnJsonArray([bodyData])],
			};
		} else {
			// Event type not subscribed to, log and ignore
			console.log(`Received event type "${eventType}" but not subscribed, ignoring.`);
			return {
				workflowData: [[]],
			};
		}
	}
	public webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// For Resend webhooks, we don't need to check if the webhook exists
				// since Resend manages webhooks independently
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				// For Resend webhooks, the webhook URL needs to be manually configured
				// in the Resend dashboard. We don't create it programmatically.
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				// For Resend webhooks, the webhook URL needs to be manually removed
				// from the Resend dashboard. We don't delete it programmatically.
				return true;
			},
		},
	};
}
