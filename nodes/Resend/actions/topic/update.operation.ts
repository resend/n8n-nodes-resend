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
    fieldName: 'topicId',
    resourceName: 'topic',
    displayName: 'Topic',
    required: true,
    placeholder: 'topic_123456',
    description: 'The topic to update',
    displayOptions: {
      show: {
        resource: ['topics'],
        operation: ['update'],
      },
    },
  }),
  {
    displayName: 'Update Fields',
    name: 'topicUpdateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['topics'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description:
          'New name for the topic. Will be displayed to contacts on the preference page.',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description:
          'New description for the topic. Helps contacts understand what emails they will receive.',
      },
      {
        displayName: 'Visibility',
        name: 'visibility',
        type: 'options',
        default: 'private',
        options: [
          { name: 'Private', value: 'private' },
          { name: 'Public', value: 'public' },
        ],
        description:
          'Whether the topic is visible on the unsubscribe page. Public topics let contacts manage their own subscriptions.',
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const topicId = resolveDynamicIdValue(this, 'topicId', index);
  const updateFields = this.getNodeParameter(
    'topicUpdateFields',
    index,
    {},
  ) as {
    name?: string;
    description?: string;
    visibility?: string;
  };

  const body: IDataObject = {};

  if (updateFields.name) {
    body.name = updateFields.name;
  }
  if (updateFields.description) {
    body.description = updateFields.description;
  }
  if (updateFields.visibility) {
    body.visibility = updateFields.visibility;
  }

  const response = await apiRequest.call(
    this,
    'PATCH',
    `/topics/${encodeURIComponent(topicId)}`,
    body,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
