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
    fieldName: 'emailIdShare',
    resourceName: 'email',
    displayName: 'Email',
    required: true,
    placeholder: '49a3999c-0ce1-4ea6-ab68-afcd6dc2e794',
    description:
      'The sent email to create a shareable link for. Obtain from the Send Email response or the List Emails operation.',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['share'],
      },
    },
  }),
  {
    displayName: 'Expires In',
    name: 'expiresIn',
    type: 'string',
    default: '',
    placeholder: '48h',
    displayOptions: {
      show: {
        resource: ['email'],
        operation: ['share'],
      },
    },
    description:
      'How long the link stays valid for, as a duration like 10m, 2 hours, or 1 day. Leave empty to use the Resend default of 48h. The duration cannot exceed 48 hours.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const emailId = resolveDynamicIdValue(this, 'emailIdShare', index);
  const expiresIn = this.getNodeParameter('expiresIn', index, '') as string;

  let body: IDataObject | undefined;
  if (expiresIn) {
    body = { expires_in: expiresIn };
  }

  const response = await apiRequest.call(
    this,
    'POST',
    `/emails/${encodeURIComponent(emailId)}/share`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
