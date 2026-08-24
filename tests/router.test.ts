import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { describe, expect, it, vi } from 'vitest';
import * as email from '../nodes/Resend/actions/email';
import { router } from '../nodes/Resend/actions/router';
import { createExecuteMock, testNode } from './helpers/context';

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

  it('throws for an unknown resource', async () => {
    const { context } = createExecuteMock({
      parameters: { resource: 'nope', operation: 'list' },
    });

    await expect(router.call(context)).rejects.toThrow(
      'Unknown resource: nope',
    );
  });

  it('explains the rename for the legacy workflows resource', async () => {
    const { context } = createExecuteMock({
      parameters: { resource: 'workflows', operation: 'list' },
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
      parameters: { resource: 'workflows', operation: 'list' },
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
