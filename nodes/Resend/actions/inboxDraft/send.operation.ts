import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  buildCustomHeaders,
  createInboxField,
  customHeadersField,
  draftIdField,
  getDraftPath,
  idempotencyHeaders,
  idempotencyKeyField,
} from '../inboxThread/shared';

export const description: INodeProperties[] = [
  createInboxField('inboxDrafts', ['send']),
  draftIdField(['send']),
  {
    displayName: 'Additional Options',
    name: 'inboxDraftSendOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['inboxDrafts'],
        operation: ['send'],
      },
    },
    options: [
      customHeadersField,
      idempotencyKeyField(
        'A unique key to ensure the draft is sent only once. Useful for retries to prevent duplicate sends. A retry with the same key within 24 hours returns the first response. Reusing the key with a different body, or while the first request is still running, returns a 409.',
      ),
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const options = this.getNodeParameter(
    'inboxDraftSendOptions',
    index,
    {},
  ) as IDataObject;

  const headers = buildCustomHeaders(options.headers);

  const response = await apiRequest.call(
    this,
    'POST',
    `${getDraftPath(this, index)}/send`,
    headers ? { headers } : undefined,
    undefined,
    idempotencyHeaders(options),
  );

  return [{ json: response, pairedItem: { item: index } }];
}
