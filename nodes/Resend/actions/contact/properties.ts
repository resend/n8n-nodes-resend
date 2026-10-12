import type { IExecuteFunctions, INodePropertyOptions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export interface ContactPropertyItem {
  key: string;
  value?: unknown;
  type?: string;
}

const STRING_OPTION: INodePropertyOptions = { name: 'String', value: 'string' };
const NUMBER_OPTION: INodePropertyOptions = { name: 'Number', value: 'number' };
const BOOLEAN_OPTION: INodePropertyOptions = {
  name: 'Boolean',
  value: 'boolean',
};
const NULL_OPTION: INodePropertyOptions = {
  name: 'Null (Clear Value)',
  value: 'null',
};

export const createPropertyTypeOptions: INodePropertyOptions[] = [
  NULL_OPTION,
  NUMBER_OPTION,
  STRING_OPTION,
];

export const updatePropertyTypeOptions: INodePropertyOptions[] = [
  BOOLEAN_OPTION,
  NULL_OPTION,
  NUMBER_OPTION,
  STRING_OPTION,
];

export function buildContactProperties(
  this: IExecuteFunctions,
  items: ContactPropertyItem[],
  index: number,
): Record<string, string | number | boolean | null> {
  const props: Record<string, string | number | boolean | null> = {};
  for (const item of items) {
    const type = item.type ?? 'string';
    const raw = item.value;
    if (type === 'null') {
      props[item.key] = null;
    } else if (type === 'number') {
      const parsed =
        typeof raw === 'number'
          ? raw
          : typeof raw === 'string' && raw.trim() !== ''
            ? Number(raw)
            : Number.NaN;
      if (!Number.isFinite(parsed)) {
        throw new NodeOperationError(
          this.getNode(),
          `Property "${item.key}" must be a number`,
          { itemIndex: index },
        );
      }
      props[item.key] = parsed;
    } else if (type === 'boolean') {
      if (typeof raw === 'boolean') {
        props[item.key] = raw;
      } else {
        const normalized = String(raw ?? '')
          .trim()
          .toLowerCase();
        if (normalized !== 'true' && normalized !== 'false') {
          throw new NodeOperationError(
            this.getNode(),
            `Property "${item.key}" must be true or false`,
            { itemIndex: index },
          );
        }
        props[item.key] = normalized === 'true';
      }
    } else {
      props[item.key] = raw === undefined || raw === null ? '' : String(raw);
    }
  }
  return props;
}
