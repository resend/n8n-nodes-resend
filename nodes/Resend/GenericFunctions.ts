import {
	IExecuteFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	NodeOperationError,
} from 'n8n-workflow';

const RESEND_API_BASE = 'https://api.resend.com';

/**
 * Helper to make authenticated requests to the Resend API.
 * Reduces duplication of Authorization headers across all API calls.
 */
export const resendRequest = async <T = unknown>(
	executeFunctions: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	apiKey: string,
	body?: Record<string, unknown> | Record<string, unknown>[],
	qs?: Record<string, string | number>,
): Promise<T> => {
	return executeFunctions.helpers.httpRequest({
		url: `${RESEND_API_BASE}${endpoint}`,
		method,
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
		body,
		qs,
		json: true,
	});
};

/**
 * Load options for dropdown fields (max 100 items).
 * Used by getTemplates, getSegments, getTopics.
 */
const loadDropdownOptions = async (
	loadOptionsFunctions: ILoadOptionsFunctions,
	endpoint: string,
): Promise<INodePropertyOptions[]> => {
	const credentials = await loadOptionsFunctions.getCredentials('resendApi');
	const apiKey = credentials.apiKey as string;

	const response = await loadOptionsFunctions.helpers.httpRequest({
		url: `${RESEND_API_BASE}${endpoint}`,
		method: 'GET',
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
		qs: { limit: 100 },
		json: true,
	});

	const items = response?.data ?? [];
	return items
		.filter((item: { id?: string }) => item?.id)
		.map((item: { id: string; name?: string }) => ({
			name: item.name ? `${item.name} (${item.id})` : item.id,
			value: item.id,
		}));
};

export const normalizeEmailList = (value: string | string[] | undefined) => {
	if (Array.isArray(value)) {
		return value
			.map((email) => String(email).trim())
			.filter((email) => email);
	}
	if (typeof value === 'string') {
		return value
			.split(',')
			.map((email) => email.trim())
			.filter((email) => email);
	}
	return [];
};

export const parseTemplateVariables = (
	executeFunctions: IExecuteFunctions,
	variablesInput: { variables?: Array<{ key: string; type: string; fallbackValue?: unknown }> } | undefined,
	fallbackKey: 'fallbackValue' | 'fallback_value',
	itemIndex: number,
) => {
	if (!variablesInput?.variables?.length) {
		return undefined;
	}

	return variablesInput.variables.map((variable) => {
		const variableEntry: Record<string, unknown> = {
			key: variable.key,
			type: variable.type,
		};

		const fallbackValue = variable.fallbackValue;
		if (fallbackValue !== undefined && fallbackValue !== '') {
			let parsedFallback: string | number = fallbackValue as string;
			if (variable.type === 'number') {
				const numericFallback = typeof fallbackValue === 'number' ? fallbackValue : Number(fallbackValue);
				if (Number.isNaN(numericFallback)) {
					throw new NodeOperationError(
						executeFunctions.getNode(),
						`Variable "${variable.key}" fallback value must be a number`,
						{ itemIndex },
					);
				}
				parsedFallback = numericFallback;
			}
			variableEntry[fallbackKey] = parsedFallback;
		}

		return variableEntry;
	});
};

export const buildTemplateSendVariables = (
	variablesInput: { variables?: Array<{ key: string; value?: unknown }> } | undefined,
) => {
	if (!variablesInput?.variables?.length) {
		return undefined;
	}
	const variables: Record<string, unknown> = {};
	for (const variable of variablesInput.variables) {
		if (!variable.key) {
			continue;
		}
		variables[variable.key] = variable.value ?? '';
	}

	return Object.keys(variables).length ? variables : undefined;
};

/**
 * Fetch list items with pagination support.
 * Returns an array of items (not the wrapper object), matching other n8n nodes like Stripe.
 */
export const requestList = async (
	executeFunctions: IExecuteFunctions,
	url: string,
	apiKey: string,
	returnAll: boolean,
	limit?: number,
): Promise<unknown[]> => {
	const targetLimit = returnAll ? 1000 : (limit ?? 50);
	const pageSize = Math.min(targetLimit, 100); // Resend API max is 100
	const qs: Record<string, string | number> = { limit: pageSize };

	const requestPage = () =>
		executeFunctions.helpers.httpRequest({
			url,
			method: 'GET',
			headers: {
				Authorization: `Bearer ${apiKey}`,
			},
			qs,
			json: true,
		});

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	const allItems: unknown[] = [];
	let hasMore = true;
	let isFirstRequest = true;

	while (hasMore) {
		// Rate limiting: wait 1 second between requests (Resend allows 2 req/sec)
		if (!isFirstRequest) {
			await sleep(1000);
		}
		isFirstRequest = false;

		const response = await requestPage();
		const responseData = Array.isArray((response as { data?: unknown[] }).data)
			? ((response as { data?: unknown[] }).data as unknown[])
			: [];
		allItems.push(...responseData);

		// Stop if we have enough items
		if (allItems.length >= targetLimit) {
			break;
		}

		hasMore = Boolean((response as { has_more?: boolean }).has_more);
		if (!hasMore || responseData.length === 0) {
			break;
		}

		const lastItem = responseData[responseData.length - 1] as { id?: string } | undefined;
		if (!lastItem?.id) {
			break;
		}

		qs.after = lastItem.id;
	}

	// Return just the items array, sliced to exact limit
	return allItems.slice(0, targetLimit);
};

export async function getTemplateVariables(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const getStringValue = (value: unknown) =>
		typeof value === 'string' && value.trim() ? value : undefined;
	const safeGet = (getter: () => unknown) => {
		try {
			return getter();
		} catch {
			return undefined;
		}
	};
	const getParameterValue = (name: string) => {
		const currentParameters = this.getCurrentNodeParameters();
		const fromCurrentParameters = getStringValue(currentParameters?.[name]);
		if (fromCurrentParameters) {
			return fromCurrentParameters;
		}

		const fromCurrentNodeParameter = getStringValue(
			safeGet(() => this.getCurrentNodeParameter(name)),
		);
		if (fromCurrentNodeParameter) {
			return fromCurrentNodeParameter;
		}

		const fromNodeParameter = getStringValue(safeGet(() => this.getNodeParameter(name, '')));
		if (fromNodeParameter) {
			return fromNodeParameter;
		}

		return undefined;
	};

	const templateId = getParameterValue('emailTemplateId') ?? getParameterValue('templateId');
	if (!templateId) {
		return [];
	}
	const normalizedTemplateId = templateId.trim();
	if (normalizedTemplateId.startsWith('={{') || normalizedTemplateId.includes('{{')) {
		return [];
	}

	const credentials = await this.getCredentials('resendApi');
	const apiKey = credentials.apiKey as string;

	const response = await this.helpers.httpRequest({
		url: `https://api.resend.com/templates/${encodeURIComponent(templateId)}`,
		method: 'GET',
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
		json: true,
	});

	const variables = response?.variables ?? [];

	return variables
		.filter((variable: { key?: string }) => variable?.key)
		.map((variable: { key: string; type?: string }) => {
			const typeLabel = variable.type ? ` (${variable.type})` : '';
			return {
				name: `${variable.key}${typeLabel}`,
				value: variable.key,
			};
		});
}

export async function getTemplates(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return loadDropdownOptions(this, '/templates');
}

export async function getSegments(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return loadDropdownOptions(this, '/segments');
}

export async function getTopics(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return loadDropdownOptions(this, '/topics');
}
