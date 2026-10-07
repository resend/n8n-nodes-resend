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
    fieldName: 'receivedEmailId',
    resourceName: 'receivedEmail',
    displayName: 'Email',
    required: true,
    placeholder: 'email_123456',
    description:
      'The received email to retrieve. Obtain from the List Receiving Emails operation or webhook payload. Returns full email details including sender, subject, body, and headers.',
    displayOptions: {
      show: {
        resource: ['receivingEmails'],
        operation: ['get'],
      },
    },
  }),
  {
    displayName: 'Options',
    name: 'receivedEmailOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['receivingEmails'],
        operation: ['get'],
      },
    },
    options: [
      {
        displayName: 'HTML Format',
        name: 'htmlFormat',
        type: 'options',
        default: 'data_uri',
        options: [
          {
            name: 'CID References',
            value: 'cid',
            description:
              'Keep the original cid: references that match attachment content IDs',
          },
          {
            name: 'Data URI',
            value: 'data_uri',
            description: 'Inline images as base64 data: URIs',
          },
        ],
        description: 'How inline images are returned inside the HTML body',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const emailId = resolveDynamicIdValue(this, 'receivedEmailId', index);

  const options = this.getNodeParameter('receivedEmailOptions', index, {}) as {
    htmlFormat?: string;
  };
  const qs: IDataObject = {};
  if (options.htmlFormat) {
    qs.html_format = options.htmlFormat;
  }

  const response = await apiRequest.call(
    this,
    'GET',
    `/emails/receiving/${encodeURIComponent(emailId)}`,
    undefined,
    qs,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
