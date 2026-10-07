import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import * as email from '../nodes/Resend/actions/email';
import { router } from '../nodes/Resend/actions/router';
import * as suppressions from '../nodes/Resend/actions/suppression';
import { createExecuteMock, testNode } from './helpers/context';

const threeItems = [{ json: {} }, { json: {} }, { json: {} }];

describe('router', () => {
  it('dispatches to the resource module for every input item', async () => {
    const executeSpy = vi
      .spyOn(email, 'execute')
      .mockImplementation(async function (this: unknown, index: number) {
        return [{ json: { index }, pairedItem: { item: index } }];
      });

    const { context } = createExecuteMock({
      parameters: { resource: 'email', operation: 'send' },
      inputData: [{ json: {} }, { json: {} }],
    });

    const result = await router.call(context);

    expect(result).toEqual([
      [
        { json: { index: 0 }, pairedItem: { item: 0 } },
        { json: { index: 1 }, pairedItem: { item: 1 } },
      ],
    ]);
    expect(executeSpy).toHaveBeenCalledTimes(2);
    executeSpy.mockRestore();
  });

  it('runs a list operation once no matter how many input items there are', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        resource: 'suppressions',
        operation: 'list',
        returnAll: false,
        limit: 50,
      },
      inputData: threeItems,
      response: { data: [{ id: 'sup_1' }, { id: 'sup_2' }], has_more: false },
    });

    const [items] = await router.call(context);

    expect(httpRequest).toHaveBeenCalledTimes(1);
    expect(items).toEqual([
      { json: { id: 'sup_1' }, pairedItem: { item: 0 } },
      { json: { id: 'sup_2' }, pairedItem: { item: 0 } },
    ]);
  });

  it('still runs an item operation once per input item', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        resource: 'suppressions',
        operation: 'get',
        suppressionIdentifier: { mode: 'id', value: 'sup_1' },
      },
      inputData: threeItems,
      response: { id: 'sup_1' },
    });

    const [items] = await router.call(context);

    expect(httpRequest).toHaveBeenCalledTimes(3);
    expect(items).toHaveLength(3);
  });

  it('runs every item when item 0 is an item operation, even if a later item resolves to a list operation', async () => {
    const operations = ['get', 'list', 'get'];
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        resource: 'suppressions',
        suppressionIdentifier: { mode: 'id', value: 'sup_1' },
        returnAll: false,
        limit: 50,
      },
      inputData: threeItems,
      responses: [
        { id: 'sup_1' },
        { data: [{ id: 'sup_2' }], has_more: false },
        { id: 'sup_3' },
      ],
    });
    const getNodeParameter = context.getNodeParameter.bind(context);
    context.getNodeParameter = ((
      name: string,
      itemIndex: number,
      fallbackValue?: unknown,
    ) =>
      name === 'operation'
        ? operations[itemIndex]
        : getNodeParameter(
            name,
            itemIndex,
            fallbackValue,
          )) as typeof context.getNodeParameter;

    const [items] = await router.call(context);

    expect(httpRequest).toHaveBeenCalledTimes(3);
    expect(items.map((item) => item.json.id)).toEqual([
      'sup_1',
      'sup_2',
      'sup_3',
    ]);
  });

  it('produces a single error item when a list operation fails with continueOnFail', async () => {
    const executeSpy = vi
      .spyOn(suppressions, 'execute')
      .mockRejectedValue(new Error('list boom'));

    const { context } = createExecuteMock({
      parameters: { resource: 'suppressions', operation: 'list' },
      inputData: threeItems,
      continueOnFail: true,
    });

    const result = await router.call(context);

    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      [{ json: { error: 'list boom' }, pairedItem: { item: 0 } }],
    ]);
    executeSpy.mockRestore();
  });

  it('throws for an unknown resource', async () => {
    const { context } = createExecuteMock({
      parameters: { resource: 'nope', operation: 'list' },
    });

    await expect(router.call(context)).rejects.toThrow(
      'Unknown resource: nope',
    );
  });

  it('runs ID-scoped list operations once per input item', async () => {
    for (const [resource, operation, field, path] of [
      [
        'broadcasts',
        'listClickedLinks',
        'broadcastIdClickedLinks',
        'broadcasts/bc_{i}/clicked-links',
      ],
      [
        'broadcasts',
        'listRecipients',
        'broadcastIdRecipients',
        'broadcasts/bc_{i}/recipients',
      ],
      ['segments', 'listContacts', 'segmentId', 'segments/bc_{i}/contacts'],
      ['webhooks', 'listEvents', 'webhookId', 'webhooks/bc_{i}/events'],
      [
        'webhooks',
        'listEventAttempts',
        'webhookId',
        'webhooks/bc_{i}/events/evt_1/attempts',
      ],
    ]) {
      const { context, httpRequest } = createExecuteMock({
        parameters: {
          resource,
          operation,
          recipientType: 'sent',
          webhookEventId: 'evt_1',
          returnAll: false,
          limit: 50,
        },
        inputData: threeItems,
        response: { data: [{ id: 'row' }], has_more: false },
      });
      const getNodeParameter = context.getNodeParameter.bind(context);
      context.getNodeParameter = ((
        name: string,
        itemIndex: number,
        fallbackValue?: unknown,
      ) =>
        name === field
          ? { mode: 'id', value: `bc_${itemIndex}` }
          : getNodeParameter(
              name,
              itemIndex,
              fallbackValue,
            )) as typeof context.getNodeParameter;

      const [items] = await router.call(context);

      expect(httpRequest).toHaveBeenCalledTimes(3);
      expect(
        httpRequest.mock.calls.map(
          (call) => (call as unknown as [string, { url: string }])[1].url,
        ),
      ).toEqual(
        [0, 1, 2].map(
          (i) => `https://api.resend.com/${path.replace('{i}', String(i))}`,
        ),
      );
      expect(items.map((item) => item.pairedItem)).toEqual([
        { item: 0 },
        { item: 1 },
        { item: 2 },
      ]);
    }
  });

  it('pages through automation runs when returning all', async () => {
    const { context, httpRequest } = createExecuteMock({
      parameters: {
        resource: 'automations',
        operation: 'listRuns',
        automationId: 'auto_1',
        returnAll: true,
      },
      responses: [
        { data: [{ id: 'run_1' }], has_more: true },
        { data: [{ id: 'run_2' }], has_more: false },
      ],
    });

    const [items] = await router.call(context);

    expect(httpRequest).toHaveBeenCalledTimes(2);
    expect(
      (httpRequest.mock.calls[1] as unknown as [string, { qs: unknown }])[1].qs,
    ).toMatchObject({ after: 'run_1' });
    expect(items.map((item) => item.json.id)).toEqual(['run_1', 'run_2']);
  });

  it('explains the rename for the legacy workflows resource', async () => {
    const { context } = createExecuteMock({
      parameters: { resource: 'workflows' },
    });

    const error = await router.call(context).catch((thrown) => thrown);

    expect(error).toBeInstanceOf(NodeOperationError);
    expect((error as NodeOperationError).message).toContain(
      'The Workflow resource was renamed to Automation',
    );
    expect((error as NodeOperationError).description).toContain(
      'select the Automation resource',
    );
  });

  it('keeps the operation error description when continuing', async () => {
    const { context } = createExecuteMock({
      parameters: { resource: 'workflows' },
      continueOnFail: true,
    });

    const [items] = await router.call(context);

    expect(items[0].json).toMatchObject({
      error: expect.stringContaining(
        'The Workflow resource was renamed to Automation',
      ),
      description: expect.stringContaining('select the Automation resource'),
    });
    expect(items[0].json).not.toHaveProperty('statusCode');
  });

  it('collects the error message when continueOnFail is enabled', async () => {
    const executeSpy = vi
      .spyOn(email, 'execute')
      .mockRejectedValue(new Error('boom'));

    const { context } = createExecuteMock({
      parameters: { resource: 'email', operation: 'send' },
      continueOnFail: true,
    });

    const result = await router.call(context);

    expect(result).toEqual([
      [{ json: { error: 'boom' }, pairedItem: { item: 0 } }],
    ]);
    executeSpy.mockRestore();
  });

  it('adds status code and description for API errors when continuing', async () => {
    const apiError = new NodeApiError(
      testNode,
      { message: 'Email not found', name: 'not_found', statusCode: 404 },
      {
        message: 'Not Found (404)',
        description: 'Email not found',
        httpCode: '404',
      },
    );
    const executeSpy = vi.spyOn(email, 'execute').mockRejectedValue(apiError);

    const { context } = createExecuteMock({
      parameters: { resource: 'email', operation: 'retrieve' },
      continueOnFail: true,
    });

    const [items] = await router.call(context);

    expect(items[0].json).toMatchObject({
      statusCode: '404',
      description: 'Email not found',
    });
    executeSpy.mockRestore();
  });

  it('rethrows as a node error when continueOnFail is disabled', async () => {
    const executeSpy = vi.spyOn(email, 'execute').mockRejectedValue({
      name: 'validation_error',
      message: 'Invalid `from` field',
      statusCode: 422,
    });

    const { context } = createExecuteMock({
      parameters: { resource: 'email', operation: 'send' },
    });

    await expect(router.call(context)).rejects.toBeInstanceOf(NodeApiError);
    executeSpy.mockRestore();
  });
});
