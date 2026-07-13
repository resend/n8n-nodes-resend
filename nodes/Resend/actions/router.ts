import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import * as account from './account';
import * as broadcasts from './broadcast';
import * as contacts from './contact';
import * as contactProperties from './contactProperty';
import * as domains from './domain';
import * as email from './email';
import * as events from './event';
import * as logs from './log';
import * as receivingEmails from './receivingEmail';
import * as segments from './segment';
import * as templates from './template';
import * as topics from './topic';
import * as webhooks from './webhook';
import * as workflows from './workflow';

const resourceModules: Record<string, { execute: typeof email.execute }> = {
  account,
  email,
  templates,
  domains,
  broadcasts,
  segments,
  topics,
  contacts,
  contactProperties,
  webhooks,
  receivingEmails,
  workflows,
  events,
  logs,
};

export async function router(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;

      const mod = resourceModules[resource];
      if (!mod) {
        throw new NodeOperationError(
          this.getNode(),
          `Unknown resource: ${resource}`,
        );
      }

      const executionData = await mod.execute.call(this, i, operation);
      returnData.push(...executionData);
    } catch (error) {
      if (this.continueOnFail()) {
        const errorData: IDataObject = {
          error: (error as Error).message,
        };

        if (error instanceof NodeApiError) {
          if (error.httpCode) {
            errorData.statusCode = error.httpCode;
          }
          if (error.description) {
            errorData.description = error.description;
          }
        }

        returnData.push({ json: errorData, pairedItem: { item: i } });
        continue;
      }
      throw error;
    }
  }

  return [returnData];
}
