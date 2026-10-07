import type {
  IExecuteFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
  INode,
  INodeExecutionData,
  IWebhookFunctions,
} from 'n8n-workflow';
import { vi } from 'vitest';

export const testNode: INode = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Resend',
  type: 'n8n-nodes-resend.resend',
  typeVersion: 1,
  position: [0, 0],
  parameters: {},
};

export type ParameterMap = Record<string, unknown>;

const MISSING = Symbol('missing');

function readParameter(
  parameters: ParameterMap,
  name: string,
): unknown | typeof MISSING {
  if (name in parameters) {
    return parameters[name];
  }
  const segments = name.split('.');
  let current: unknown = parameters;
  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return MISSING;
    }
    const container = current as Record<string, unknown>;
    if (!(segment in container)) {
      return MISSING;
    }
    current = container[segment];
  }
  return current;
}

export interface ExecuteMockOptions {
  parameters?: ParameterMap;
  inputData?: INodeExecutionData[];
  response?: unknown;
  responses?: unknown[];
  requestError?: unknown;
  continueOnFail?: boolean;
  instanceId?: string;
  signedResumeUrl?: string;
  credentials?: Record<string, Record<string, unknown>>;
}

export interface ExecuteMock {
  context: IExecuteFunctions;
  httpRequest: ReturnType<typeof vi.fn>;
  waitCalls: Date[];
}

export function createExecuteMock(
  options: ExecuteMockOptions = {},
): ExecuteMock {
  const parameters = options.parameters ?? {};
  const responses = options.responses ? [...options.responses] : undefined;
  const waitCalls: Date[] = [];

  const httpRequest = vi.fn(async () => {
    if (options.requestError) {
      throw options.requestError;
    }
    if (responses) {
      if (responses.length === 0) {
        throw new Error('No mocked response left');
      }
      return responses.shift();
    }
    return options.response ?? {};
  });

  const context = {
    getNode: () => testNode,
    getInputData: () => options.inputData ?? [{ json: {} }],
    continueOnFail: () => options.continueOnFail ?? false,
    getInstanceId: () => options.instanceId,
    getSignedResumeUrl: (query: Record<string, string>) =>
      `${options.signedResumeUrl ?? 'https://n8n.test/resume'}?approved=${query.approved}`,
    putExecutionToWait: async (waitTill: Date) => {
      waitCalls.push(waitTill);
    },
    getCredentials: async (name: string) => {
      const credential = options.credentials?.[name];
      if (!credential) {
        throw new Error(`No credentials of type "${name}"`);
      }
      return credential;
    },
    getNodeParameter: (
      name: string,
      _itemIndex: number,
      fallbackValue?: unknown,
    ) => {
      const value = readParameter(parameters, name);
      if (value === MISSING) {
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        throw new Error(`Parameter "${name}" is not set`);
      }
      return value;
    },
    helpers: {
      httpRequestWithAuthentication: httpRequest,
      returnJsonArray: (items: unknown[]) =>
        (items as Array<Record<string, unknown>>).map((json) => ({ json })),
      getBinaryDataBuffer: async (itemIndex: number, propertyName: string) => {
        const binary = (options.inputData ?? [{ json: {} }])[itemIndex]
          ?.binary?.[propertyName];
        if (!binary) {
          throw new Error(`Binary property "${propertyName}" not found`);
        }
        return Buffer.from(binary.data, 'base64');
      },
    },
  } as unknown as IExecuteFunctions;

  return { context, httpRequest, waitCalls };
}

export interface LoadOptionsMockOptions {
  parameters?: ParameterMap;
  currentNodeParameters?: ParameterMap;
  response?: unknown;
  requestError?: unknown;
}

export interface LoadOptionsMock {
  context: ILoadOptionsFunctions;
  httpRequest: ReturnType<typeof vi.fn>;
}

export function createLoadOptionsMock(
  options: LoadOptionsMockOptions = {},
): LoadOptionsMock {
  const parameters = options.parameters ?? {};

  const httpRequest = vi.fn(async () => {
    if (options.requestError) {
      throw options.requestError;
    }
    return options.response ?? {};
  });

  const context = {
    getNode: () => testNode,
    getCurrentNodeParameters: () => options.currentNodeParameters,
    getCurrentNodeParameter: (name: string) => {
      const value = readParameter(parameters, name);
      if (value === MISSING) {
        throw new Error(`Parameter "${name}" is not set`);
      }
      return value;
    },
    getNodeParameter: (name: string, fallbackValue?: unknown) => {
      const value = readParameter(parameters, name);
      if (value === MISSING) {
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        throw new Error(`Parameter "${name}" is not set`);
      }
      return value;
    },
    helpers: {
      httpRequestWithAuthentication: httpRequest,
    },
  } as unknown as ILoadOptionsFunctions;

  return { context, httpRequest };
}

export interface HookMockOptions {
  parameters?: ParameterMap;
  staticData?: Record<string, unknown>;
  credentials?: Record<string, Record<string, unknown>>;
  webhookUrl?: string;
  response?: unknown;
  requestError?: unknown;
}

export interface HookMock {
  context: IHookFunctions;
  httpRequest: ReturnType<typeof vi.fn>;
  staticData: Record<string, unknown>;
}

export function createHookMock(options: HookMockOptions = {}): HookMock {
  const staticData = options.staticData ?? {};
  const parameters = options.parameters ?? {};

  const httpRequest = vi.fn(async () => {
    if (options.requestError) {
      throw options.requestError;
    }
    return options.response ?? {};
  });

  const context = {
    getNode: () => testNode,
    getWorkflowStaticData: () => staticData,
    getNodeWebhookUrl: () => options.webhookUrl ?? 'https://n8n.test/webhook',
    getNodeParameter: (name: string, fallbackValue?: unknown) => {
      const value = readParameter(parameters, name);
      if (value === MISSING) {
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        throw new Error(`Parameter "${name}" is not set`);
      }
      return value;
    },
    getCredentials: async (name: string) => {
      const credential = options.credentials?.[name];
      if (!credential) {
        throw new Error(`No credentials of type "${name}"`);
      }
      return credential;
    },
    helpers: {
      httpRequestWithAuthentication: httpRequest,
    },
  } as unknown as IHookFunctions;

  return { context, httpRequest, staticData };
}

export interface ResponseMock {
  statusCode?: number;
  jsonBody?: unknown;
  body?: string;
  headers: Record<string, string>;
}

export interface WebhookMockOptions {
  parameters?: ParameterMap;
  bodyData?: unknown;
  headers?: Record<string, unknown>;
  request?: Record<string, unknown>;
  staticData?: Record<string, unknown>;
  credentials?: Record<string, Record<string, unknown>>;
  webhookUrl?: string;
}

export interface WebhookMock {
  context: IWebhookFunctions;
  response: ResponseMock;
}

export function createWebhookMock(
  options: WebhookMockOptions = {},
): WebhookMock {
  const parameters = options.parameters ?? {};
  const response: ResponseMock = { headers: {} };

  const responseObject = {
    status(code: number) {
      response.statusCode = code;
      return responseObject;
    },
    json(payload: unknown) {
      response.jsonBody = payload;
      return responseObject;
    },
    send(payload: string) {
      response.body = payload;
      return responseObject;
    },
    setHeader(name: string, value: string) {
      response.headers[name] = value;
    },
  };

  const context = {
    getNode: () => testNode,
    getBodyData: () => options.bodyData,
    getHeaderData: () => options.headers ?? {},
    getRequestObject: () => options.request ?? { method: 'POST' },
    getResponseObject: () => responseObject,
    getWorkflowStaticData: () => options.staticData ?? {},
    getNodeWebhookUrl: () => options.webhookUrl ?? 'https://n8n.test/webhook',
    getCredentials: async (name: string) => {
      const credential = options.credentials?.[name];
      if (!credential) {
        throw new Error(`No credentials of type "${name}"`);
      }
      return credential;
    },
    getNodeParameter: (name: string, fallbackValue?: unknown) => {
      const value = readParameter(parameters, name);
      if (value === MISSING) {
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        throw new Error(`Parameter "${name}" is not set`);
      }
      return value;
    },
    helpers: {
      returnJsonArray: (items: unknown[]) =>
        (items as Array<Record<string, unknown>>).map((json) => ({ json })),
    },
  } as unknown as IWebhookFunctions;

  return { context, response };
}
