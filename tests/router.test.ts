import { NodeApiError } from 'n8n-workflow';
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
