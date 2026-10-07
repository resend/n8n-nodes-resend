import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { handleResendApiError, type OperationRouter } from '../transport';
import * as account from './account';
import * as automations from './automation';
import * as broadcasts from './broadcast';
import * as contacts from './contact';
import * as contactProperties from './contactProperty';
import * as domains from './domain';
import * as email from './email';
import * as events from './event';
import * as logs from './log';
import * as receivingEmails from './receivingEmail';
import * as segments from './segment';
import * as suppressions from './suppression';
import * as templates from './template';
import * as topics from './topic';
import * as webhooks from './webhook';

const resourceModules: Record<string, { execute: OperationRouter }> = {
  account,
  automations,
  email,
  templates,
  domains,
  broadcasts,
  segments,
  suppressions,
  topics,
  contacts,
  contactProperties,
  webhooks,
  receivingEmails,
  events,
  logs,
};

const LEGACY_WORKFLOWS_RESOURCE = 'workflows';

function isListOperationAt(this: IExecuteFunctions, index: number): boolean {
  try {
    const resource = this.getNodeParameter('resource', index) as string;
    const operation = this.getNodeParameter('operation', index, '') as string;
    return (
      resourceModules[resource]?.execute.listOperations.has(operation) ?? false
    );
  } catch {
    return false;
  }
}

export async function router(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  // List operations have no per-item input: they resolve their parameters at
  // item index 0 and return a whole collection, so running them once per input
  // item would repeat the same API calls and emit duplicate output rows. Item 0
  // decides: if its `resource`/`operation` resolve to a list operation, only
  // item 0 is executed. Otherwise every item runs with its own resolved
  // `resource`/`operation`.
  const itemCount = isListOperationAt.call(this, 0) ? 1 : items.length;

  for (let i = 0; i < itemCount; i++) {
    try {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i, '') as string;

      const mod = resourceModules[resource];
      if (!mod) {
        if (resource === LEGACY_WORKFLOWS_RESOURCE) {
          throw new NodeOperationError(
            this.getNode(),
            'The Workflow resource was renamed to Automation, because Resend renamed this API from /workflows to /automations',
            {
              itemIndex: i,
              description:
                'Open this node, select the Automation resource, pick the operation again, and re-enter the ID in the Automation ID field (previously Workflow ID).',
            },
          );
        }

        throw new NodeOperationError(
          this.getNode(),
          `Unknown resource: ${resource}`,
        );
      }

      const executionData = await mod.execute.call(this, i, operation);
      returnData.push(...executionData);
    } catch (error) {
      if (!this.continueOnFail()) {
        handleResendApiError(this.getNode(), error, i);
      }

      const errorData: IDataObject = {
        error: (error as Error).message,
      };

      if (error instanceof NodeApiError && error.httpCode) {
        errorData.statusCode = error.httpCode;
      }

      if (
        (error instanceof NodeApiError ||
          error instanceof NodeOperationError) &&
        error.description
      ) {
        errorData.description = error.description;
      }

      returnData.push({ json: errorData, pairedItem: { item: i } });
    }
  }

  return [returnData];
}
