import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';
import {
	apiKeyFields,
	apiKeyOperations,
	broadcastFields,
	broadcastOperations,
	contactFields,
	contactOperations,
	contactPropertyFields,
	contactPropertyOperations,
	domainFields,
	domainOperations,
	emailFields,
	emailOperations,
	segmentFields,
	segmentOperations,
	templateFields,
	templateOperations,
	topicFields,
	topicOperations,
	webhookFields,
	webhookOperations,
} from './descriptions';
import {
	buildTemplateSendVariables,
	getSegments,
	getTemplateVariables,
	getTemplates,
	getTopics,
	normalizeEmailList,
	parseTemplateVariables,
	requestList,
} from './GenericFunctions';

export class Resend implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Resend',
		name: 'resend',
		icon: 'file:resend-icon-white.svg',
		group: ['output'],
		version: 1,
		description: 'Interact with Resend API for emails, templates, domains, API keys, broadcasts, segments, topics, contacts, contact properties, and webhooks',
		subtitle: '={{(() => { const resourceLabels = { apiKeys: "api key", broadcasts: "broadcast", contacts: "contact", contactProperties: "contact property", domains: "domain", email: "email", segments: "segment", templates: "template", topics: "topic", webhooks: "webhook" }; const operationLabels = { retrieve: "get", sendBatch: "send batch" }; const resource = $parameter["resource"]; const operation = $parameter["operation"]; const resourceLabel = resourceLabels[resource] ?? resource; const operationLabel = operationLabels[operation] ?? operation; return operationLabel + ": " + resourceLabel; })() }}',
		defaults: {
			name: 'Resend',
		},
		credentials: [
			{
				name: 'resendApi',
				required: true,
			},
		],
		inputs: ['main' as NodeConnectionType],
		outputs: ['main' as NodeConnectionType],
		properties: [
			// Resource selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true, options: [
					{
						name: 'API Key',
						value: 'apiKeys',
						description: 'Manage API keys',
					},
					{
						name: 'Broadcast',
						value: 'broadcasts',
						description: 'Manage email broadcasts',
					},
					{
						name: 'Contact',
						value: 'contacts',
						description: 'Manage contacts',
					},
					{
						name: 'Contact Property',
						value: 'contactProperties',
						description: 'Manage contact properties',
					},
					{
						name: 'Webhook',
						value: 'webhooks',
						description: 'Manage webhooks',
					},
					{
						name: 'Domain',
						value: 'domains',
						description: 'Manage email domains',
					},
					{
						name: 'Email',
						value: 'email',
						description: 'Send and manage emails',
					},
					{
						name: 'Segment',
						value: 'segments',
						description: 'Manage contact segments',
					},
					{
						name: 'Template',
						value: 'templates',
						description: 'Manage email templates',
					},
					{
						name: 'Topic',
						value: 'topics',
						description: 'Manage subscription topics',
					},
				],
				default: 'email',
			},

			...emailOperations,
			...templateOperations,
			...domainOperations,
			...apiKeyOperations,
			...broadcastOperations,
			...segmentOperations,
			...topicOperations,
			...contactOperations,
			...contactPropertyOperations,
			...webhookOperations,

			...emailFields,
			...templateFields,
			...domainFields,
			...apiKeyFields,
			...broadcastFields,
			...segmentFields,
			...topicFields,
			...contactFields,
			...contactPropertyFields,
			...webhookFields,
		],
	};
	methods = {
		loadOptions: {
			getTemplateVariables,
			getTemplates,
			getSegments,
			getTopics,
		},
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		const assertHttpsEndpoint = (endpoint: string, itemIndex: number) => {
			const normalizedEndpoint = endpoint.trim().toLowerCase();
			if (normalizedEndpoint.startsWith('http://')) {
				throw new NodeOperationError(
					this.getNode(),
					'Invalid webhook endpoint scheme. Resend requires a publicly reachable HTTPS URL.',
					{ itemIndex },
				);
			}
		};
		for (let i = 0; i < length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const credentials = await this.getCredentials('resendApi');
				const apiKey = credentials.apiKey as string;

				let response: any;

				// EMAIL OPERATIONS
				if (resource === 'email') {
					if (operation === 'send') {
						const from = this.getNodeParameter('from', i) as string;
						const toValue = this.getNodeParameter('to', i) as string | string[];
						const subject = this.getNodeParameter('subject', i) as string;
						const useTemplate = this.getNodeParameter('useTemplate', i) as boolean;
						const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as any;

						const requestBody: any = {
							from,
							to: normalizeEmailList(toValue),
							subject,
						};

						if (useTemplate) {
							const templateId = this.getNodeParameter('emailTemplateId', i) as string;
							const templateVariables = this.getNodeParameter('emailTemplateVariables', i, {}) as any;
							if (!templateId) {
								throw new NodeOperationError(
									this.getNode(),
									'Template Name or ID is required when sending with a template.',
									{ itemIndex: i },
								);
							}

							const html = this.getNodeParameter('html', i, '') as string;
							const text = this.getNodeParameter('text', i, '') as string;
							if (html || text) {
								throw new NodeOperationError(
									this.getNode(),
									'HTML/Text Content cannot be used when sending with a template.',
									{ itemIndex: i },
								);
							}

							requestBody.template = {
								id: templateId,
							};
							const variables = buildTemplateSendVariables(templateVariables);
							if (variables && Object.keys(variables).length) {
								requestBody.template.variables = variables;
							}
						} else {
							const emailFormat = this.getNodeParameter('emailFormat', i) as string;
							if (emailFormat === 'html' || emailFormat === 'both') {
								const html = this.getNodeParameter('html', i) as string;
								if (!html) {
									throw new NodeOperationError(this.getNode(), 'HTML Content is required.', { itemIndex: i });
								}
								requestBody.html = html;
							}
							if (emailFormat === 'text' || emailFormat === 'both') {
								const text = this.getNodeParameter('text', i) as string;
								if (!text) {
									throw new NodeOperationError(this.getNode(), 'Text Content is required.', { itemIndex: i });
								}
								requestBody.text = text;
							}
						}
						if (additionalOptions.cc) {
							const ccList = normalizeEmailList(additionalOptions.cc);
							if (ccList.length) {
								requestBody.cc = ccList;
							}
						}
						if (additionalOptions.bcc) {
							const bccList = normalizeEmailList(additionalOptions.bcc);
							if (bccList.length) {
								requestBody.bcc = bccList;
							}
						}
						if (additionalOptions.reply_to) {
							const replyToList = normalizeEmailList(additionalOptions.reply_to);
							if (replyToList.length) {
								requestBody.reply_to = replyToList;
							}
						}
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
						if (additionalOptions.tags?.tags?.length) {
							requestBody.tags = additionalOptions.tags.tags
								.filter((tag: { name?: string }) => tag.name)
								.map((tag: { name: string; value?: string }) => ({
									name: tag.name,
									value: tag.value ?? '',
								}));
						}
						if (additionalOptions.topic_id) requestBody.topic_id = additionalOptions.topic_id;
						if (additionalOptions.scheduled_at) requestBody.scheduled_at = additionalOptions.scheduled_at;

						// Validate that attachments aren't used with scheduled emails
						if (
							additionalOptions.attachments &&
							additionalOptions.attachments.attachments &&
							additionalOptions.attachments.attachments.length > 0 &&
							additionalOptions.scheduled_at
						) {
							throw new NodeOperationError(
								this.getNode(),
								'Attachments cannot be used with scheduled emails. Please remove either the attachments or the scheduled time.',
								{ itemIndex: i },
							);
						}

						// Handle attachments
						if (
							additionalOptions.attachments &&
							additionalOptions.attachments.attachments &&
							additionalOptions.attachments.attachments.length > 0
						) {
							requestBody.attachments = additionalOptions.attachments.attachments
								.map((attachment: any) => {
									const contentId = attachment.content_id;
									const contentType = attachment.content_type;
								if (attachment.attachmentType === 'binaryData') {
									// Get binary data from the current item
									const binaryPropertyName = attachment.binaryPropertyName || 'data';
									const binaryData = items[i].binary?.[binaryPropertyName];
									if (!binaryData) {
										throw new NodeOperationError(this.getNode(), `Binary property "${binaryPropertyName}" not found in item ${i}`, { itemIndex: i });
									}

									const attachmentEntry: Record<string, unknown> = {
										filename: attachment.filename,
										content: binaryData.data, // This should be base64 content
									};
									if (contentId) {
										attachmentEntry.content_id = contentId;
									}
									if (contentType) {
										attachmentEntry.content_type = contentType;
									}
									return attachmentEntry;
								} else if (attachment.attachmentType === 'url') {
									if (!attachment.filename) {
										throw new NodeOperationError(
											this.getNode(),
											'File Name is required for URL attachments.',
											{ itemIndex: i },
										);
									}
									if (!attachment.fileUrl) {
										throw new NodeOperationError(
											this.getNode(),
											'File URL is required for URL attachments.',
											{ itemIndex: i },
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
								.filter((attachment: any) => attachment !== null);
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/emails',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					} else if (operation === 'sendBatch') {
						const emailsData = this.getNodeParameter('emails', i) as any;
						const batchOptions = this.getNodeParameter('batchOptions', i, {}) as any;

						const emails = emailsData.emails.map((email: any) => {
							const legacyContentType = email.contentType;
							const useTemplate = email.useTemplate ?? false;
							const emailFormat = email.emailFormat ?? 'html';
							const contentType = legacyContentType ?? (useTemplate ? 'template' : emailFormat);
							const additionalOptions = email.additionalOptions ?? {};
							const emailObj: any = {
								from: email.from,
								to: normalizeEmailList(email.to),
								subject: email.subject,
							};

							const ccValue = additionalOptions.cc ?? email.cc;
							if (ccValue) {
								const ccList = normalizeEmailList(ccValue);
								if (ccList.length) {
									emailObj.cc = ccList;
								}
							}
							const bccValue = additionalOptions.bcc ?? email.bcc;
							if (bccValue) {
								const bccList = normalizeEmailList(bccValue);
								if (bccList.length) {
									emailObj.bcc = bccList;
								}
							}
							const replyToValue = additionalOptions.reply_to ?? email.reply_to;
							if (replyToValue) {
								const replyToList = normalizeEmailList(replyToValue);
								if (replyToList.length) {
									emailObj.reply_to = replyToList;
								}
							}
							const attachments = additionalOptions.attachments ?? email.attachments;
							if (attachments?.attachments?.length) {
								emailObj.attachments = attachments.attachments.map((attachment: any) => {
									const binaryPropertyName = attachment.binaryPropertyName || 'data';
									const binaryData = items[i].binary?.[binaryPropertyName];
									if (!binaryData) {
										throw new NodeOperationError(
											this.getNode(),
											`Binary property "${binaryPropertyName}" not found in item ${i}`,
											{ itemIndex: i },
										);
									}
									if (!attachment.filename) {
										throw new NodeOperationError(
											this.getNode(),
											'File Name is required for batch email attachments.',
											{ itemIndex: i },
										);
									}

									const attachmentEntry: Record<string, unknown> = {
										filename: attachment.filename,
										content: binaryData.data,
									};
									if (attachment.content_id) {
										attachmentEntry.content_id = attachment.content_id;
									}
									if (attachment.content_type) {
										attachmentEntry.content_type = attachment.content_type;
									}
									return attachmentEntry;
								});
							}
							const headersInput = additionalOptions.headers ?? email.headers;
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
							const tagsInput = additionalOptions.tags ?? email.tags;
							if (tagsInput?.tags?.length) {
								emailObj.tags = tagsInput.tags
									.filter((tag: { name?: string }) => tag.name)
									.map((tag: { name: string; value?: string }) => ({
										name: tag.name,
										value: tag.value ?? '',
									}));
							}
							const topicId = additionalOptions.topic_id ?? email.topic_id;
							if (topicId) {
								emailObj.topic_id = topicId;
							}

							if (contentType === 'template') {
								if (!email.templateId) {
									throw new NodeOperationError(
										this.getNode(),
										'Template Name or ID is required for batch emails when using templates.',
										{ itemIndex: i },
									);
								}
								if (email.html || email.text) {
									throw new NodeOperationError(
										this.getNode(),
										'HTML/Text Content cannot be used when sending batch emails with templates.',
										{ itemIndex: i },
									);
								}
								emailObj.template = {
									id: email.templateId,
								};
								const variables = buildTemplateSendVariables(email.templateVariables);
								if (variables && Object.keys(variables).length) {
									emailObj.template.variables = variables;
								}
							} else {
								if (contentType === 'html' || contentType === 'both') {
									if (!email.html) {
										throw new NodeOperationError(
											this.getNode(),
											'HTML Content is required for batch emails.',
											{ itemIndex: i },
										);
									}
									emailObj.html = email.html;
								}

								if (contentType === 'text' || contentType === 'both') {
									if (!email.text) {
										throw new NodeOperationError(
											this.getNode(),
											'Text Content is required for batch emails.',
											{ itemIndex: i },
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
							Authorization: `Bearer ${apiKey}`,
							'Content-Type': 'application/json',
						};
						if (batchOptions.idempotency_key) {
							headers['Idempotency-Key'] = batchOptions.idempotency_key;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/emails/batch',
							method: 'POST',
							headers,
							qs,
							body: emails,
							json: true,
						});

					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const items = await requestList(this, 'https://api.resend.com/emails', apiKey, returnAll, limit);
						for (const item of items) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;

					} else if (operation === 'retrieve') {
						const emailId = this.getNodeParameter('emailId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/emails/${emailId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'update') {
						const emailId = this.getNodeParameter('emailId', i) as string;
						const scheduledAt = this.getNodeParameter('scheduled_at', i) as string;

						const requestBody: any = {};
						if (scheduledAt) requestBody.scheduled_at = scheduledAt;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/emails/${emailId}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'cancel') {
						const emailId = this.getNodeParameter('emailId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/emails/${emailId}/cancel`,
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {},
							json: true,
						});
					}

					// TEMPLATE OPERATIONS
				} else if (resource === 'templates') {
					if (operation === 'create') {
						const templateName = this.getNodeParameter('templateName', i) as string;
						const templateFrom = this.getNodeParameter('templateFrom', i) as string;
						const templateSubject = this.getNodeParameter('templateSubject', i) as string;
						const templateHtml = this.getNodeParameter('templateHtml', i) as string;
						const templateVariables = this.getNodeParameter('templateVariables', i, {}) as any;

						const requestBody: any = {
							name: templateName,
							from: templateFrom,
							subject: templateSubject,
							html: templateHtml,
						};

						const variables = parseTemplateVariables(this, templateVariables, 'fallbackValue', i);
						if (variables?.length) {
							requestBody.variables = variables;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/templates',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					} else if (operation === 'get') {
						const templateId = this.getNodeParameter('templateId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/templates/${templateId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const items = await requestList(this, 'https://api.resend.com/templates', apiKey, returnAll, limit);
						for (const item of items) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;
					} else if (operation === 'update') {
						const templateId = this.getNodeParameter('templateId', i) as string;
						const updateFields = this.getNodeParameter('templateUpdateFields', i, {}) as any;
						const templateVariables = this.getNodeParameter('templateVariables', i, {}) as any;

						const requestBody: any = {};

						if (updateFields.alias) requestBody.alias = updateFields.alias;
						if (updateFields.from) requestBody.from = updateFields.from;
						if (updateFields.html) requestBody.html = updateFields.html;
						if (updateFields.name) requestBody.name = updateFields.name;
						if (updateFields.reply_to) {
							if (Array.isArray(updateFields.reply_to)) {
								requestBody.reply_to = updateFields.reply_to;
							} else if (
								typeof updateFields.reply_to === 'string' &&
								updateFields.reply_to.includes(',')
							) {
								requestBody.reply_to = updateFields.reply_to
									.split(',')
									.map((email: string) => email.trim())
									.filter((email: string) => email);
							} else {
								requestBody.reply_to = updateFields.reply_to;
							}
						}
						if (updateFields.subject) requestBody.subject = updateFields.subject;
						if (Object.prototype.hasOwnProperty.call(updateFields, 'text')) {
							requestBody.text = updateFields.text;
						}

						const variables = parseTemplateVariables(this, templateVariables, 'fallbackValue', i);
						if (variables?.length) {
							requestBody.variables = variables;
						}

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/templates/${templateId}`,
							method: 'PUT',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					} else if (operation === 'delete') {
						const templateId = this.getNodeParameter('templateId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/templates/${templateId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// DOMAIN OPERATIONS
				} else if (resource === 'domains') {
					if (operation === 'create') {
						const domainName = this.getNodeParameter('domainName', i) as string;
						const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as any;

						const requestBody: any = { name: domainName };
						if (additionalOptions.region) requestBody.region = additionalOptions.region;
						if (additionalOptions.custom_return_path) requestBody.custom_return_path = additionalOptions.custom_return_path;

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/domains',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'get') {
						const domainId = this.getNodeParameter('domainId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/domains/${domainId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'verify') {
						const domainId = this.getNodeParameter('domainId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/domains/${domainId}/verify`,
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {},
							json: true,
						});
					} else if (operation === 'update') {
						const domainId = this.getNodeParameter('domainId', i) as string;
						const domainUpdateOptions = this.getNodeParameter('domainUpdateOptions', i, {}) as any;

						const requestBody: any = {};
						if (domainUpdateOptions.click_tracking !== undefined) requestBody.click_tracking = domainUpdateOptions.click_tracking;
						if (domainUpdateOptions.open_tracking !== undefined) requestBody.open_tracking = domainUpdateOptions.open_tracking;
						if (domainUpdateOptions.tls) requestBody.tls = domainUpdateOptions.tls;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/domains/${domainId}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const items = await requestList(this, 'https://api.resend.com/domains', apiKey, returnAll, limit);
						for (const item of items) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;

					} else if (operation === 'delete') {
						const domainId = this.getNodeParameter('domainId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/domains/${domainId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// API KEY OPERATIONS
				} else if (resource === 'apiKeys') {
					if (operation === 'create') {
						const apiKeyName = this.getNodeParameter('apiKeyName', i) as string;
						const permission = this.getNodeParameter('permission', i) as string;
						const domainId = this.getNodeParameter('domainId', i, '') as string;

						const requestBody: any = {
							name: apiKeyName,
							permission,
						};

						if (permission === 'sending_access' && domainId) {
							requestBody.domain_id = domainId;
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/api-keys',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const items = await requestList(this, 'https://api.resend.com/api-keys', apiKey, returnAll, limit);
						for (const item of items) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;

					} else if (operation === 'delete') {
						const apiKeyId = this.getNodeParameter('apiKeyId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/api-keys/${apiKeyId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// BROADCAST OPERATIONS
				} else if (resource === 'broadcasts') {
					if (operation === 'create') {
						const segmentId = this.getNodeParameter('segmentId', i) as string;
						const broadcastFrom = this.getNodeParameter('broadcastFrom', i) as string;
						const broadcastSubject = this.getNodeParameter('broadcastSubject', i) as string;
						const broadcastHtml = this.getNodeParameter('broadcastHtml', i) as string;
						const createOptions = this.getNodeParameter('broadcastCreateOptions', i, {}) as any;

						const requestBody: any = {
							segment_id: segmentId,
							from: broadcastFrom,
							subject: broadcastSubject,
							html: broadcastHtml,
						};

						if (createOptions.name) requestBody.name = createOptions.name;
						if (createOptions.reply_to) {
							if (Array.isArray(createOptions.reply_to)) {
								requestBody.reply_to = createOptions.reply_to;
							} else if (
								typeof createOptions.reply_to === 'string' &&
								createOptions.reply_to.includes(',')
							) {
								requestBody.reply_to = createOptions.reply_to
									.split(',')
									.map((email: string) => email.trim())
									.filter((email: string) => email);
							} else {
								requestBody.reply_to = createOptions.reply_to;
							}
						}
						if (Object.prototype.hasOwnProperty.call(createOptions, 'text')) {
							requestBody.text = createOptions.text;
						}
						if (createOptions.topic_id) requestBody.topic_id = createOptions.topic_id;

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/broadcasts',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'get') {
						const broadcastId = this.getNodeParameter('broadcastId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/broadcasts/${broadcastId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'update') {
						const broadcastId = this.getNodeParameter('broadcastId', i) as string;
						const updateFields = this.getNodeParameter('broadcastUpdateFields', i, {}) as any;

						const requestBody: any = {};
						if (updateFields.segment_id) requestBody.segment_id = updateFields.segment_id;
						if (updateFields.from) requestBody.from = updateFields.from;
						if (updateFields.subject) requestBody.subject = updateFields.subject;
						if (updateFields.html) requestBody.html = updateFields.html;
						if (Object.prototype.hasOwnProperty.call(updateFields, 'text')) {
							requestBody.text = updateFields.text;
						}
						if (updateFields.reply_to) {
							if (Array.isArray(updateFields.reply_to)) {
								requestBody.reply_to = updateFields.reply_to;
							} else if (
								typeof updateFields.reply_to === 'string' &&
								updateFields.reply_to.includes(',')
							) {
								requestBody.reply_to = updateFields.reply_to
									.split(',')
									.map((email: string) => email.trim())
									.filter((email: string) => email);
							} else {
								requestBody.reply_to = updateFields.reply_to;
							}
						}
						if (updateFields.name) requestBody.name = updateFields.name;
						if (updateFields.topic_id) requestBody.topic_id = updateFields.topic_id;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/broadcasts/${broadcastId}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'send') {
						const broadcastId = this.getNodeParameter('broadcastId', i) as string;
						const sendOptions = this.getNodeParameter('broadcastSendOptions', i, {}) as any;
						const requestBody: any = {};

						if (sendOptions.scheduled_at) {
							requestBody.scheduled_at = sendOptions.scheduled_at;
						}

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/broadcasts/${broadcastId}/send`,
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const items = await requestList(this, 'https://api.resend.com/broadcasts', apiKey, returnAll, limit);
						for (const item of items) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;

					} else if (operation === 'delete') {
						const broadcastId = this.getNodeParameter('broadcastId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/broadcasts/${broadcastId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// SEGMENT OPERATIONS
				} else if (resource === 'segments') {
					if (operation === 'create') {
						const segmentName = this.getNodeParameter('segmentName', i) as string;

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/segments',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: {
								name: segmentName,
							},
							json: true,
						});

					} else if (operation === 'get') {
						const segmentId = this.getNodeParameter('segmentId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/segments/${segmentId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const items = await requestList(this, 'https://api.resend.com/segments', apiKey, returnAll, limit);
						for (const item of items) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;

					} else if (operation === 'delete') {
						const segmentId = this.getNodeParameter('segmentId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/segments/${segmentId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// TOPIC OPERATIONS
				} else if (resource === 'topics') {
					if (operation === 'create') {
						const topicName = this.getNodeParameter('topicName', i) as string;
						const defaultSubscription = this.getNodeParameter('topicDefaultSubscription', i) as string;
						const createOptions = this.getNodeParameter('topicCreateOptions', i, {}) as any;

						const requestBody: any = {
							name: topicName,
							default_subscription: defaultSubscription,
						};

						if (Object.prototype.hasOwnProperty.call(createOptions, 'description')) {
							requestBody.description = createOptions.description;
						}
						if (createOptions.visibility) requestBody.visibility = createOptions.visibility;

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/topics',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'get') {
						const topicId = this.getNodeParameter('topicId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/topics/${topicId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const items = await requestList(this, 'https://api.resend.com/topics', apiKey, returnAll, limit);
						for (const item of items) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;

					} else if (operation === 'update') {
						const topicId = this.getNodeParameter('topicId', i) as string;
						const updateFields = this.getNodeParameter('topicUpdateFields', i, {}) as any;

						const requestBody: any = {};

						if (updateFields.name) requestBody.name = updateFields.name;
						if (Object.prototype.hasOwnProperty.call(updateFields, 'description')) {
							requestBody.description = updateFields.description;
						}
						if (updateFields.visibility) requestBody.visibility = updateFields.visibility;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/topics/${topicId}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'delete') {
						const topicId = this.getNodeParameter('topicId', i) as string;

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/topics/${topicId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}

					// CONTACT OPERATIONS
				} else if (resource === 'contacts') {
					if (operation === 'create') {
						const email = this.getNodeParameter('email', i) as string;
						const createFields = this.getNodeParameter('contactCreateFields', i, {}) as any;
						const requestBody: any = {
							email,
						};

						if (createFields.first_name) requestBody.first_name = createFields.first_name;
						if (createFields.last_name) requestBody.last_name = createFields.last_name;
						if (createFields.unsubscribed !== undefined) requestBody.unsubscribed = createFields.unsubscribed;

						if (createFields.properties?.properties?.length) {
							const properties: Record<string, string> = {};
							for (const property of createFields.properties.properties) {
								if (property.key) {
									properties[property.key] = property.value ?? '';
								}
							}
							if (Object.keys(properties).length) {
								requestBody.properties = properties;
							}
						}

						if (createFields.segments?.segments?.length) {
							requestBody.segments = createFields.segments.segments
								.filter((segment: { id?: string }) => segment.id)
								.map((segment: { id: string }) => ({ id: segment.id }));
						}

						if (createFields.topics?.topics?.length) {
							requestBody.topics = createFields.topics.topics
								.filter((topic: { id?: string }) => topic.id)
								.map((topic: { id: string; subscription?: string }) => ({
									id: topic.id,
									subscription: topic.subscription || 'opt_in',
								}));
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/contacts',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'get') {
						const contactIdentifier = this.getNodeParameter('contactIdentifier', i) as string;
						const encodedIdentifier = encodeURIComponent(contactIdentifier);

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/contacts/${encodedIdentifier}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'update') {
						const updateBy = this.getNodeParameter('updateBy', i) as string;
						const updateFields = this.getNodeParameter('contactUpdateFields', i, {}) as any;

						const requestBody: any = {};

						if (updateBy === 'id') {
							requestBody.id = this.getNodeParameter('contactId', i) as string;
						} else {
							requestBody.email = this.getNodeParameter('contactEmail', i) as string;
						}

						if (updateFields.first_name) requestBody.first_name = updateFields.first_name;
						if (updateFields.last_name) requestBody.last_name = updateFields.last_name;
						if (updateFields.unsubscribed !== undefined) requestBody.unsubscribed = updateFields.unsubscribed;

						if (updateFields.properties?.properties?.length) {
							const properties: Record<string, string> = {};
							for (const property of updateFields.properties.properties) {
								if (property.key) {
									properties[property.key] = property.value ?? '';
								}
							}
							if (Object.keys(properties).length) {
								requestBody.properties = properties;
							}
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/contacts',
							method: 'PUT',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});

					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const items = await requestList(this, 'https://api.resend.com/contacts', apiKey, returnAll, limit);
						for (const item of items) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;

					} else if (operation === 'delete') {
						const contactIdentifier = this.getNodeParameter('contactIdentifier', i) as string;
						const encodedIdentifier = encodeURIComponent(contactIdentifier);

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/contacts/${encodedIdentifier}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}
					// CONTACT PROPERTY OPERATIONS
				} else if (resource === 'contactProperties') {
					if (operation === 'create') {
						const key = this.getNodeParameter('contactPropertyKey', i) as string;
						const type = this.getNodeParameter('contactPropertyType', i) as string;
						const fallbackValue = this.getNodeParameter('contactPropertyFallbackValue', i, '') as string;

						const requestBody: Record<string, unknown> = {
							key,
							type,
						};

						if (fallbackValue !== '') {
							if (type === 'number') {
								const parsedFallback = Number(fallbackValue);
								if (Number.isNaN(parsedFallback)) {
									throw new NodeOperationError(
										this.getNode(),
										'Fallback value must be a number.',
										{ itemIndex: i },
									);
								}
								requestBody.fallback_value = parsedFallback;
							} else {
								requestBody.fallback_value = fallbackValue;
							}
						}

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/contact-properties',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					} else if (operation === 'get') {
						const contactPropertyId = this.getNodeParameter('contactPropertyId', i) as string;
						const encodedContactPropertyId = encodeURIComponent(contactPropertyId);

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/contact-properties/${encodedContactPropertyId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const items = await requestList(this, 'https://api.resend.com/contact-properties', apiKey, returnAll, limit);
						for (const item of items) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;
					} else if (operation === 'update') {
						const contactPropertyId = this.getNodeParameter('contactPropertyId', i) as string;
						const encodedContactPropertyId = encodeURIComponent(contactPropertyId);
						const updateFields = this.getNodeParameter('contactPropertyUpdateFields', i, {}) as {
							fallback_value?: string;
						};

						if (!Object.keys(updateFields).length) {
							throw new NodeOperationError(
								this.getNode(),
								'Add at least one field to update.',
								{ itemIndex: i },
							);
						}

						const fallbackValue = updateFields.fallback_value ?? '';
						const currentProperty = await this.helpers.httpRequest({
							url: `https://api.resend.com/contact-properties/${encodedContactPropertyId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});

						const propertyType = currentProperty?.type;
						const requestBody: Record<string, unknown> = {};

						if (propertyType === 'number') {
							const parsedFallback = Number(fallbackValue);
							if (Number.isNaN(parsedFallback)) {
								throw new NodeOperationError(
									this.getNode(),
									'Fallback value must be a number.',
									{ itemIndex: i },
								);
							}
							requestBody.fallback_value = parsedFallback;
						} else {
							requestBody.fallback_value = fallbackValue;
						}

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/contact-properties/${encodedContactPropertyId}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					} else if (operation === 'delete') {
						const contactPropertyId = this.getNodeParameter('contactPropertyId', i) as string;
						const encodedContactPropertyId = encodeURIComponent(contactPropertyId);

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/contact-properties/${encodedContactPropertyId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}
					// WEBHOOK OPERATIONS
				} else if (resource === 'webhooks') {
					if (operation === 'create') {
						const endpoint = this.getNodeParameter('webhookEndpoint', i) as string;
						const events = this.getNodeParameter('webhookEvents', i) as string[];
						assertHttpsEndpoint(endpoint, i);

						const requestBody = {
							endpoint,
							events,
						};

						response = await this.helpers.httpRequest({
							url: 'https://api.resend.com/webhooks',
							method: 'POST',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					} else if (operation === 'get') {
						const webhookId = this.getNodeParameter('webhookId', i) as string;
						const encodedWebhookId = encodeURIComponent(webhookId);

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/webhooks/${encodedWebhookId}`,
							method: 'GET',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = this.getNodeParameter('limit', i, 50) as number;
						const items = await requestList(this, 'https://api.resend.com/webhooks', apiKey, returnAll, limit);
						for (const item of items) {
							returnData.push({ json: item as IDataObject, pairedItem: { item: i } });
						}
						continue;
					} else if (operation === 'update') {
						const webhookId = this.getNodeParameter('webhookId', i) as string;
						const encodedWebhookId = encodeURIComponent(webhookId);
						const updateFields = this.getNodeParameter('webhookUpdateFields', i, {}) as {
							endpoint?: string;
							events?: string[];
							status?: string;
						};

						if (!Object.keys(updateFields).length) {
							throw new NodeOperationError(
								this.getNode(),
								'Add at least one field to update.',
								{ itemIndex: i },
							);
						}

						let endpoint = updateFields.endpoint?.trim();
						let events = Array.isArray(updateFields.events) && updateFields.events.length
							? updateFields.events
							: undefined;
						let status = updateFields.status;

						if (endpoint) {
							assertHttpsEndpoint(endpoint, i);
						}

						if (!endpoint || !events || !status) {
							const currentWebhook = await this.helpers.httpRequest({
								url: `https://api.resend.com/webhooks/${encodedWebhookId}`,
								method: 'GET',
								headers: {
									Authorization: `Bearer ${apiKey}`,
								},
								json: true,
							});

							endpoint = endpoint ?? currentWebhook?.endpoint ?? currentWebhook?.url;
							events = events ?? currentWebhook?.events;
							status = status ?? currentWebhook?.status;
						}

						if (!endpoint || !events || !status) {
							throw new NodeOperationError(
								this.getNode(),
								'Webhook update requires endpoint, events, and status.',
								{ itemIndex: i },
							);
						}

						if (endpoint) {
							assertHttpsEndpoint(endpoint, i);
						}

						const requestBody = {
							endpoint,
							events,
							status,
						};

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/webhooks/${encodedWebhookId}`,
							method: 'PATCH',
							headers: {
								Authorization: `Bearer ${apiKey}`,
								'Content-Type': 'application/json',
							},
							body: requestBody,
							json: true,
						});
					} else if (operation === 'delete') {
						const webhookId = this.getNodeParameter('webhookId', i) as string;
						const encodedWebhookId = encodeURIComponent(webhookId);

						response = await this.helpers.httpRequest({
							url: `https://api.resend.com/webhooks/${encodedWebhookId}`,
							method: 'DELETE',
							headers: {
								Authorization: `Bearer ${apiKey}`,
							},
							json: true,
						});
					}
				}

				returnData.push({ json: response, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error);
			}
		}
		return [returnData];
	}
}
