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
    fieldName: 'contactIdAddSegment',
    resourceName: 'contact',
    displayName: 'Contact',
    required: true,
    placeholder: 'con_123456',
    description:
      'The unique identifier of the contact to add to the segment. Obtain from the List Contacts or Create Contact operation.',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['addToSegment'],
      },
    },
  }),
  createDynamicIdField({
    fieldName: 'segmentIdAdd',
    resourceName: 'segment',
    displayName: 'Segment',
    required: true,
    placeholder: 'seg_123456',
    description:
      'The unique identifier of the segment to add the contact to. Segments allow grouping contacts for targeted broadcasts.',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['addToSegment'],
      },
    },
  }),
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const contactId = resolveDynamicIdValue(this, 'contactIdAddSegment', index);
  const segmentId = resolveDynamicIdValue(this, 'segmentIdAdd', index);

  const response = await apiRequest.call(
    this,
    'POST',
    `/contacts/${encodeURIComponent(contactId)}/segments/${encodeURIComponent(segmentId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
