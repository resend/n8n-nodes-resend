import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import {
  apiRequest,
  assertHttpsEndpoint,
  buildTemplateSendVariables,
  createListExecutionData,
  createOperationRouter,
  getCredentialType,
  handleResendApiError,
  normalizeEmailList,
  parseTemplateVariables,
  RESEND_API_BASE,
  requestList,
} from '../nodes/Resend/transport';
import {
  createExecuteMock,
  createLoadOptionsMock,
  testNode,
} from './helpers/context';

describe('normalizeEmailList', () => {
  it('splits a comma separated string and trims entries', () => {
    expect(normalizeEmailList(' one@example.com , two@example.com ')).toEqual([
      'one@example.com',
      'two@example.com',
    ]);
  });

  it('trims array entries and drops empty ones', () => {
    expect(
      normalizeEmailList([' one@example.com ', '', 'two@example.com']),
    ).toEqual(['one@example.com', 'two@example.com']);
  });

  it('returns an empty list for undefined', () => {
    expect(normalizeEmailList(undefined)).toEqual([]);
  });

  it('returns an empty list for a blank string', () => {
    expect(normalizeEmailList('  ,  ')).toEqual([]);
  });
});

describe('parseTemplateVariables', () => {
  const { context } = createExecuteMock();

  it('returns undefined when no variables are configured', () => {
    expect(
      parseTemplateVariables(context, undefined, 'fallbackValue', 0),
    ).toBeUndefined();
    expect(
      parseTemplateVariables(context, { variables: [] }, 'fallbackValue', 0),
    ).toBeUndefined();
  });

  it('keeps key and type and omits empty fallbacks', () => {
    const result = parseTemplateVariables(
      context,
      { variables: [{ key: 'name', type: 'string', fallbackValue: '' }] },
      'fallbackValue',
      0,
    );

    expect(result).toEqual([{ key: 'name', type: 'string' }]);
  });

  it('uses the requested fallback key name', () => {
    const result = parseTemplateVariables(
      context,
      { variables: [{ key: 'name', type: 'string', fallbackValue: 'Ada' }] },
      'fallback_value',
      0,
    );

    expect(result).toEqual([
      { key: 'name', type: 'string', fallback_value: 'Ada' },
    ]);
  });

  it('coerces numeric fallbacks', () => {
    const result = parseTemplateVariables(
      context,
      { variables: [{ key: 'count', type: 'number', fallbackValue: '42' }] },
      'fallbackValue',
      0,
    );

    expect(result).toEqual([
      { key: 'count', type: 'number', fallbackValue: 42 },
    ]);
  });

  it('throws when a numeric fallback is not a number', () => {
    expect(() =>
      parseTemplateVariables(
        context,
        { variables: [{ key: 'count', type: 'number', fallbackValue: 'abc' }] },
        'fallbackValue',
        3,
      ),
    ).toThrow(/fallback value must be a number/);
  });
});

describe('buildTemplateSendVariables', () => {
  it('returns undefined when nothing is configured', () => {
    expect(buildTemplateSendVariables(undefined)).toBeUndefined();
    expect(buildTemplateSendVariables({ variables: [] })).toBeUndefined();
  });

  it('reads plain string keys', () => {
    expect(
      buildTemplateSendVariables({
        variables: [{ key: ' name ', value: 'Ada' }],
      }),
    ).toEqual({ name: 'Ada' });
  });

  it('reads resourceLocator keys', () => {
    expect(
      buildTemplateSendVariables({
        variables: [{ key: { mode: 'list', value: ' name ' }, value: 'Ada' }],
      }),
    ).toEqual({ name: 'Ada' });
  });

  it('skips entries without a usable key', () => {
    expect(
      buildTemplateSendVariables({
        variables: [
          { key: '   ', value: 'ignored' },
          { key: { mode: 'list', value: 42 }, value: 'ignored' },
          { key: 'kept', value: 'yes' },
        ],
      }),
    ).toEqual({ kept: 'yes' });
  });

  it('defaults missing values to an empty string', () => {
    expect(
      buildTemplateSendVariables({ variables: [{ key: 'name' }] }),
    ).toEqual({
      name: '',
    });
  });
});

describe('assertHttpsEndpoint', () => {
  it('accepts https endpoints', () => {
    expect(() =>
      assertHttpsEndpoint(testNode, 'https://example.com/hook'),
    ).not.toThrow();
  });

  it('rejects http endpoints regardless of case or padding', () => {
    expect(() =>
      assertHttpsEndpoint(testNode, '  HTTP://example.com  '),
    ).toThrow(NodeOperationError);
  });
});

describe('createListExecutionData', () => {
  it('wraps items and pairs them with the first input item', () => {
    const { context } = createExecuteMock();

    expect(
      createListExecutionData.call(context, [{ id: 'a' }, { id: 'b' }]),
    ).toEqual([
      { json: { id: 'a' }, pairedItem: { item: 0 } },
      { json: { id: 'b' }, pairedItem: { item: 0 } },
    ]);
  });
});

describe('createOperationRouter', () => {
  it('routes item operations with the item index', async () => {
    const create = { execute: vi.fn(async () => [{ json: { ok: true } }]) };
    const { context } = createExecuteMock();
    const execute = createOperationRouter({ create });

    await expect(execute.call(context, 2, 'create')).resolves.toEqual([
      { json: { ok: true } },
    ]);
    expect(create.execute).toHaveBeenCalledWith(2);
  });

  it('routes list operations without an index', async () => {
    const list = { execute: vi.fn(async () => []) };
    const { context } = createExecuteMock();
    const execute = createOperationRouter({}, { list });

    await execute.call(context, 5, 'list');

    expect(list.execute).toHaveBeenCalledWith();
  });

  it('prefers list operations when a name exists in both maps', async () => {
    const itemOp = { execute: vi.fn(async () => []) };
    const listOp = { execute: vi.fn(async () => []) };
    const { context } = createExecuteMock();
    const execute = createOperationRouter({ list: itemOp }, { list: listOp });

    await execute.call(context, 0, 'list');

    expect(listOp.execute).toHaveBeenCalled();
    expect(itemOp.execute).not.toHaveBeenCalled();
  });

  it('throws for unknown operations', async () => {
    const { context } = createExecuteMock();
    const execute = createOperationRouter({});

    await expect(execute.call(context, 0, 'nope')).rejects.toThrow(
      'Unsupported operation: nope',
    );
  });
});

describe('getCredentialType', () => {
  it('maps the execute context authentication parameter', () => {
    const apiKey = createExecuteMock({
      parameters: { authentication: 'apiKey' },
    });
    const oauth = createExecuteMock({
      parameters: { authentication: 'oAuth2' },
    });

    expect(getCredentialType(apiKey.context)).toBe('resendApi');
    expect(getCredentialType(oauth.context)).toBe('resendOAuth2Api');
  });

  it('maps the load options context authentication parameter', () => {
    const { context } = createLoadOptionsMock({
      parameters: { authentication: 'oAuth2' },
    });

    expect(getCredentialType(context)).toBe('resendOAuth2Api');
  });

  it('defaults to the API key credential', () => {
    const { context } = createExecuteMock();

    expect(getCredentialType(context)).toBe('resendApi');
  });
});

describe('apiRequest', () => {
  it('sends the default headers and resolves the response', async () => {
    const { context, httpRequest } = createExecuteMock({
      response: { id: 'abc' },
    });

    await expect(
      apiRequest.call(context, 'GET', '/emails/abc'),
    ).resolves.toEqual({
      id: 'abc',
    });
    expect(httpRequest).toHaveBeenCalledWith('resendApi', {
      url: `${RESEND_API_BASE}/emails/abc`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'n8n-nodes-resend',
      },
      json: true,
    });
  });

  it('adds the body and non-empty query string', async () => {
    const { context, httpRequest } = createExecuteMock();

    await apiRequest.call(
      context,
      'POST',
      '/emails',
      { subject: 'hi' },
      { limit: 10 },
    );

    const options = httpRequest.mock.calls[0][1];
    expect(options.body).toEqual({ subject: 'hi' });
    expect(options.qs).toEqual({ limit: 10 });
  });

  it('omits an empty query string', async () => {
    const { context, httpRequest } = createExecuteMock();

    await apiRequest.call(context, 'GET', '/emails', undefined, {});

    expect(httpRequest.mock.calls[0][1]).not.toHaveProperty('qs');
  });

  it('converts request failures into node errors', async () => {
    const { context } = createExecuteMock({
      requestError: {
        name: 'validation_error',
        message: 'Invalid `from` field',
        statusCode: 422,
      },
    });

    await expect(
      apiRequest.call(context, 'POST', '/emails'),
    ).rejects.toBeInstanceOf(NodeApiError);
  });
});

describe('requestList', () => {
  it('requests a single page limited by the limit parameter', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { returnAll: false, limit: 2 },
      response: {
        data: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        has_more: true,
      },
    });

    const items = await requestList.call(context, '/suppressions');

    expect(items).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(httpRequest).toHaveBeenCalledTimes(1);
    expect(httpRequest.mock.calls[0][1].qs).toEqual({ limit: 2 });
  });

  it('merges extra query string values', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { returnAll: false, limit: 50 },
      response: { data: [] },
    });

    await requestList.call(context, '/suppressions', { origin: 'bounce' });

    expect(httpRequest.mock.calls[0][1].qs).toEqual({
      limit: 50,
      origin: 'bounce',
    });
  });

  it('paginates with the last item id when returning all results', async () => {
    vi.useFakeTimers();
    const { context, httpRequest } = createExecuteMock({
      parameters: { returnAll: true },
      responses: [
        { data: [{ id: 'a' }], has_more: true },
        { data: [{ id: 'b' }], has_more: false },
      ],
    });

    const pending = requestList.call(context, '/contacts');
    await vi.runAllTimersAsync();
    const items = await pending;
    vi.useRealTimers();

    expect(items).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(httpRequest).toHaveBeenCalledTimes(2);
    expect(httpRequest.mock.calls[1][1].qs.after).toBe('a');
  });

  it('caps the page size at 100 items', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { returnAll: true },
      responses: [{ data: [], has_more: false }],
    });

    await requestList.call(context, '/contacts');

    expect(httpRequest.mock.calls[0][1].qs.limit).toBe(100);
  });

  it('stops when the last item has no id', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: { returnAll: true },
      responses: [{ data: [{ email: 'a@example.com' }], has_more: true }],
    });

    const items = await requestList.call(context, '/contacts');

    expect(items).toEqual([{ email: 'a@example.com' }]);
    expect(httpRequest).toHaveBeenCalledTimes(1);
  });

  it('tolerates a response without a data array', async () => {
    const { context } = createExecuteMock({
      parameters: { returnAll: true },
      responses: [{}],
    });

    await expect(requestList.call(context, '/contacts')).resolves.toEqual([]);
  });
});

describe('handleResendApiError', () => {
  const expectNodeApiError = (error: unknown) => {
    try {
      handleResendApiError(testNode, error);
    } catch (thrown) {
      return thrown as NodeApiError;
    }
    throw new Error('handleResendApiError did not throw');
  };

  it('formats the error name as a title', () => {
    const error = expectNodeApiError({
      name: 'validation_error',
      message: 'Invalid field',
      statusCode: 422,
    });

    expect(error.message).toBe('Validation Error (422)');
    expect(error.description).toBe('Invalid field');
    expect(error.httpCode).toBe('422');
  });

  it('escapes angle brackets and backticks in messages', () => {
    const error = expectNodeApiError({
      name: 'validation_error',
      message: 'The `from` field must use <name@example.com>',
      statusCode: 422,
    });

    expect(error.description).toBe(
      "The 'from' field must use &lt;name@example.com&gt;",
    );
  });

  it('explains daily quota errors and includes the reset window', () => {
    const error = expectNodeApiError({
      name: 'Error',
      message: 'request failed',
      cause: {
        response: {
          status: 429,
          headers: { 'retry-after': '60' },
          data: {
            name: 'daily_quota_exceeded',
            message: 'Daily quota reached.',
            statusCode: 429,
          },
        },
      },
    });

    expect(error.message).toBe('Daily Quota Exceeded (429)');
    expect(error.description).toContain('Upgrade your plan');
    expect(error.description).toContain('approximately 60 second(s)');
  });

  it('explains monthly quota errors', () => {
    const error = expectNodeApiError({
      name: 'monthly_quota_exceeded',
      message: 'Monthly quota reached.',
      statusCode: 429,
    });

    expect(error.description).toContain('increase your monthly email quota');
  });

  it('reports rate limit headers', () => {
    const error = expectNodeApiError({
      name: 'Error',
      message: 'boom',
      cause: {
        response: {
          headers: {
            'ratelimit-limit': '10',
            'ratelimit-remaining': '0',
            'ratelimit-reset': '1',
          },
          data: {
            name: 'rate_limit_exceeded',
            message: 'Too many requests.',
            statusCode: 429,
          },
        },
      },
    });

    expect(error.description).toContain('Limit: 10 req/s, remaining: 0.');
    expect(error.description).toContain('Retry after 1 second(s).');
  });

  it('explains the contact quota validation error', () => {
    const error = expectNodeApiError({
      name: 'validation_error',
      message: 'You have reached your contacts quota',
      statusCode: 403,
    });

    expect(error.message).toBe('Contact Quota Exceeded (403)');
    expect(error.description).toContain('Upgrade your Marketing plan');
  });

  it('parses a Resend error encoded in a JSON message string', () => {
    const error = expectNodeApiError(
      new Error(
        JSON.stringify({
          name: 'not_found',
          message: 'Email not found',
          statusCode: 404,
        }),
      ),
    );

    expect(error.message).toBe('Not Found (404)');
  });

  it('reads errors nested two causes deep', () => {
    const error = expectNodeApiError({
      cause: {
        cause: {
          response: {
            data: {
              name: 'not_found',
              message: 'Domain not found',
              statusCode: 404,
            },
          },
        },
      },
    });

    expect(error.message).toBe('Not Found (404)');
  });

  it('falls back to the response status when the payload has none', () => {
    const error = expectNodeApiError({
      cause: {
        response: {
          status: 401,
          data: { name: 'restricted_api_key', message: 'Restricted key' },
        },
      },
    });

    expect(error.httpCode).toBe('401');
  });

  it('rethrows node errors untouched', () => {
    const original = new NodeOperationError(testNode, 'stop');

    expect(() => handleResendApiError(testNode, original)).toThrow(original);
  });

  it('wraps unknown errors', () => {
    const error = expectNodeApiError(new Error('socket hang up'));

    expect(error).toBeInstanceOf(NodeApiError);
  });

  it('attaches the item index when provided', () => {
    try {
      handleResendApiError(
        testNode,
        { name: 'not_found', message: 'missing', statusCode: 404 },
        4,
      );
    } catch (error) {
      expect((error as NodeApiError).context?.itemIndex).toBe(4);
    }
  });
});
