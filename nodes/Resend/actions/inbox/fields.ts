import type { IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
  createDynamicIdField,
  resolveDynamicIdValue,
} from '../../utils/dynamicFields';

export const LABEL_COLOR_OPTIONS = [
  { name: 'Bronze', value: 'bronze' },
  { name: 'Crimson', value: 'crimson' },
  { name: 'Cyan', value: 'cyan' },
  { name: 'Grass', value: 'grass' },
  { name: 'Iris', value: 'iris' },
  { name: 'Lime', value: 'lime' },
  { name: 'Mauve', value: 'mauve' },
  { name: 'Orange', value: 'orange' },
  { name: 'Plum', value: 'plum' },
  { name: 'Teal', value: 'teal' },
  { name: 'Yellow', value: 'yellow' },
];

export function inboxIdField(
  operation: string,
  description: string,
): INodeProperties {
  return createDynamicIdField({
    fieldName: 'inboxId',
    resourceName: 'inbox',
    displayName: 'Inbox',
    required: true,
    placeholder: 'b3e2b2b6-3f0e-4c8e-9ad3-2f43a1e2c7f1',
    description,
    displayOptions: {
      show: {
        resource: ['inboxes'],
        operation: [operation],
      },
    },
  });
}

export function labelIdField(
  operation: string,
  description: string,
): INodeProperties {
  return createDynamicIdField({
    fieldName: 'inboxLabelId',
    resourceName: 'inboxLabel',
    displayName: 'Label',
    required: true,
    placeholder: '7f9c1d2e-4a6b-4c3d-8e15-9b0a7c6d5e34',
    description,
    displayOptions: {
      show: {
        resource: ['inboxes'],
        operation: [operation],
      },
    },
  });
}

function requireId(
  context: IExecuteFunctions,
  fieldName: string,
  label: string,
  index: number,
): string {
  const value = String(
    resolveDynamicIdValue(context, fieldName, index) ?? '',
  ).trim();
  if (!value) {
    throw new NodeOperationError(context.getNode(), `${label} is required`, {
      itemIndex: index,
    });
  }
  return value;
}

export function inboxPath(
  context: IExecuteFunctions,
  index: number,
  suffix = '',
): string {
  const inboxId = requireId(context, 'inboxId', 'Inbox', index);
  return `/inboxes/${encodeURIComponent(inboxId)}${suffix}`;
}

export function labelPath(context: IExecuteFunctions, index: number): string {
  const labelId = requireId(context, 'inboxLabelId', 'Label', index);
  return inboxPath(context, index, `/labels/${encodeURIComponent(labelId)}`);
}
