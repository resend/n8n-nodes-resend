import type { INodeProperties } from 'n8n-workflow';
import { describe, expect, it } from 'vitest';
import * as account from '../nodes/Resend/actions/account';
import * as broadcasts from '../nodes/Resend/actions/broadcast';
import * as contacts from '../nodes/Resend/actions/contact';
import * as contactProperties from '../nodes/Resend/actions/contactProperty';
import * as domains from '../nodes/Resend/actions/domain';
import * as email from '../nodes/Resend/actions/email';
import * as events from '../nodes/Resend/actions/event';
import * as logs from '../nodes/Resend/actions/log';
import * as receivingEmails from '../nodes/Resend/actions/receivingEmail';
import { router } from '../nodes/Resend/actions/router';
import * as segments from '../nodes/Resend/actions/segment';
import * as suppressions from '../nodes/Resend/actions/suppression';
import * as templates from '../nodes/Resend/actions/template';
import * as topics from '../nodes/Resend/actions/topic';
import * as webhooks from '../nodes/Resend/actions/webhook';
import * as workflows from '../nodes/Resend/actions/workflow';
import { Resend } from '../nodes/Resend/Resend.node';
import { createExecuteMock } from './helpers/context';

type ResourceModule = {
  descriptions: INodeProperties[];
  operations: INodeProperties[];
  execute: (
    this: unknown,
    index: number,
    operation: string,
  ) => Promise<unknown>;
} & Record<string, unknown>;

const resourceModules: Record<string, ResourceModule> = {
  account: account as unknown as ResourceModule,
  broadcasts: broadcasts as unknown as ResourceModule,
  contacts: contacts as unknown as ResourceModule,
  contactProperties: contactProperties as unknown as ResourceModule,
  domains: domains as unknown as ResourceModule,
  email: email as unknown as ResourceModule,
  events: events as unknown as ResourceModule,
  logs: logs as unknown as ResourceModule,
  receivingEmails: receivingEmails as unknown as ResourceModule,
  segments: segments as unknown as ResourceModule,
  suppressions: suppressions as unknown as ResourceModule,
  templates: templates as unknown as ResourceModule,
  topics: topics as unknown as ResourceModule,
  webhooks: webhooks as unknown as ResourceModule,
  workflows: workflows as unknown as ResourceModule,
};

const node = new Resend();

const resourceProperty = node.description.properties.find(
  (property) => property.name === 'resource',
) as INodeProperties;

const resourceValues = (resourceProperty.options ?? []).map(
  (option) => (option as { value: string }).value,
);

function operationOptions(module: ResourceModule) {
  const operationProperty = module.operations.find(
    (property) => property.name === 'operation',
  );
  return (operationProperty?.options ?? []) as Array<{
    name: string;
    value: string;
    description?: string;
    action?: string;
  }>;
}

describe('node description', () => {
  it('declares the node identity used by n8n', () => {
    expect(node.description.name).toBe('resend');
    expect(node.description.displayName).toBe('Resend');
    expect(node.description.version).toBe(1);
    expect(node.description.usableAsTool).toBe(true);
  });

  it('offers both credentials behind the authentication switch', () => {
    expect(node.description.credentials).toEqual([
      {
        name: 'resendOAuth2Api',
        required: true,
        displayOptions: { show: { authentication: ['oAuth2'] } },
      },
      {
        name: 'resendApi',
        required: true,
        displayOptions: { show: { authentication: ['apiKey'] } },
      },
    ]);
  });

  it('starts with the authentication selector', () => {
    const [first] = node.description.properties;

    expect(first.name).toBe('authentication');
    expect(first.default).toBe('oAuth2');
    expect(
      (first.options ?? []).map(
        (option) => (option as { value: string }).value,
      ),
    ).toEqual(['apiKey', 'oAuth2']);
  });

  it('lists every implemented resource exactly once', () => {
    expect([...resourceValues].sort()).toEqual(
      Object.keys(resourceModules).sort(),
    );
    expect(new Set(resourceValues).size).toBe(resourceValues.length);
  });

  it('defaults to the email resource', () => {
    expect(resourceProperty.default).toBe('email');
  });

  it('labels every resource in the subtitle expression', () => {
    for (const resource of resourceValues) {
      expect(node.description.subtitle).toContain(`${resource}:`);
    }
  });

  it('exposes a load options and a list search method per searchable resource', () => {
    expect(Object.keys(node.methods.listSearch).sort()).toEqual(
      Object.keys(node.methods.loadOptions).sort(),
    );
  });

  it('includes the descriptions of every resource module', () => {
    for (const [resource, module] of Object.entries(resourceModules)) {
      expect(
        node.description.properties.filter((property) =>
          module.descriptions.includes(property),
        ).length,
        `descriptions of ${resource} are registered`,
      ).toBe(module.descriptions.length);
    }
  });

  it('routes execution through the resource router', () => {
    expect(node.execute).toBe(router);
  });
});

describe.each(
  Object.entries(resourceModules),
)('%s resource', (resource, module) => {
  const options = operationOptions(module);

  it('declares an operation selector scoped to the resource', () => {
    const operationProperty = module.operations.find(
      (property) => property.name === 'operation',
    );

    expect(operationProperty?.type).toBe('options');
    expect(operationProperty?.noDataExpression).toBe(true);
    expect(operationProperty?.displayOptions?.show?.resource).toEqual([
      resource,
    ]);
    expect(options.length).toBeGreaterThan(0);
  });

  it('defaults to one of its own operations', () => {
    const operationProperty = module.operations.find(
      (property) => property.name === 'operation',
    );

    expect(options.map((option) => option.value)).toContain(
      operationProperty?.default,
    );
  });

  it('describes every operation for the workflow editor', () => {
    for (const option of options) {
      expect(
        option.name,
        `${resource}.${option.value} has a name`,
      ).toBeTruthy();
      expect(
        option.description,
        `${resource}.${option.value} has a description`,
      ).toBeTruthy();
      expect(
        option.action,
        `${resource}.${option.value} has an action`,
      ).toBeTruthy();
    }
  });

  it('lists operations alphabetically', () => {
    const names = options.map((option) => option.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('exports an operation module for every listed operation', () => {
    for (const option of options) {
      const operationModule = module[option.value] as
        | { execute?: unknown }
        | undefined;

      expect(
        typeof operationModule?.execute,
        `${resource}.${option.value} is exported`,
      ).toBe('function');
    }
  });

  it('starts the descriptions with the operation selector', () => {
    expect(module.descriptions[0]).toBe(module.operations[0]);
  });

  it('scopes every description property to the resource', () => {
    for (const property of module.descriptions) {
      expect(
        property.displayOptions?.show?.resource,
        `${resource}.${property.name} is scoped`,
      ).toEqual([resource]);
    }
  });

  it('routes every listed operation', async () => {
    const { context } = createExecuteMock({ response: {} });

    for (const option of options) {
      let message = '';
      try {
        await module.execute.call(context, 0, option.value);
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message, `${resource}.${option.value} is routed`).not.toContain(
        'Unsupported operation',
      );
    }
  });

  it('rejects an unknown operation', async () => {
    const { context } = createExecuteMock({});

    await expect(
      module.execute.call(context, 0, 'doesNotExist'),
    ).rejects.toThrow('Unsupported operation: doesNotExist');
  });

  it('is reachable through the router', async () => {
    const { context } = createExecuteMock({
      parameters: { resource, operation: 'doesNotExist' },
    });

    await expect(router.call(context)).rejects.toThrow(
      'Unsupported operation: doesNotExist',
    );
  });
});
