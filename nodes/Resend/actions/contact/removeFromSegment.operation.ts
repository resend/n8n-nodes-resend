import type {
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
    fieldName: 'contactIdRemoveSegment',
    resourceName: 'contact',
    displayName: 'Contact',
    required: true,
    placeholder: 'con_123456',
    description:
      'The unique identifier of the contact to remove from the segment. Obtain from the List Contacts operation.',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['removeFromSegment'],
      },
    },
  }),
  createDynamicIdField({
    fieldName: 'segmentIdRemove',
    resourceName: 'segment',
    displayName: 'Segment',
    required: true,
    placeholder: 'seg_123456',
    description:
      'The unique identifier of the segment to remove the contact from. The contact will no longer receive broadcasts targeting this segment.',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['removeFromSegment'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const contactId = resolveDynamicIdValue(
    this,
    'contactIdRemoveSegment',
    index,
  );
  const segmentId = resolveDynamicIdValue(this, 'segmentIdRemove', index);

  const response = await apiRequest.call(
    this,
    'DELETE',
    `/contacts/${encodeURIComponent(contactId)}/segments/${encodeURIComponent(segmentId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
