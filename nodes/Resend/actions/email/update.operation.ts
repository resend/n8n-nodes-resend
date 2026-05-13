import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';

export const description: INodeProperties[] = [
  createDynamicIdField({
    fieldName: 'emailId',
    resourceName: 'email',
    displayName: 'Email',
    required: true,
    placeholder: 'ae2014de-c168-4c61-8267-70d2662a1ce1',
    description:
      'The scheduled email to update. Obtain from the Send Email response when scheduling emails for future delivery.',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['update'],
      },
    },
  }),
  {
    displayName: 'Scheduled At',
    name: 'scheduledAt',
    type: 'string',
    default: '',
    placeholder: '2024-08-05T11:52:01.858Z',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['update'],
      },
    },
    description:
      'New scheduled delivery time for the email. Must be in ISO 8601 format (e.g., 2024-08-05T11:52:01.858Z). Only works for emails that have not yet been sent.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const emailId = resolveDynamicIdValue(this, 'emailId', index);
  const scheduledAt = this.getNodeParameter('scheduledAt', index) as string;

  const body: IDataObject = {};
  if (scheduledAt) {
    body.scheduled_at = scheduledAt;
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/emails/${encodeURIComponent(emailId)}`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
