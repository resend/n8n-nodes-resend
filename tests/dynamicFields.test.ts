import { describe, expect, it } from 'vitest';
import {
  createDynamicIdField,
  RESOURCE_DISPLAY_MAP,
  RESOURCE_METHOD_MAP,
  resolveDynamicIdValue,
} from '../nodes/Resend/utils/dynamicFields';
import { createExecuteMock } from './helpers/context';

describe('resource maps', () => {
  it('describes the same resources in both maps', () => {
    expect(Object.keys(RESOURCE_METHOD_MAP).sort()).toEqual(
      Object.keys(RESOURCE_DISPLAY_MAP).sort(),
    );
  });

  it('maps every resource to a getter method name', () => {
    for (const method of Object.values(RESOURCE_METHOD_MAP)) {
      expect(method).toMatch(/^get[A-Z]/);
    }
  });
});

describe('createDynamicIdField', () => {
  it('builds a resourceLocator with list and id modes', () => {
    const field = createDynamicIdField({
      fieldName: 'templateId',
      resourceName: 'template',
      displayName: 'Template',
      required: true,
    });

    expect(field.type).toBe('resourceLocator');
    expect(field.name).toBe('templateId');
    expect(field.displayName).toBe('Template');
    expect(field.required).toBe(true);
    expect(field.default).toEqual({ mode: 'list', value: '' });
    expect(field.modes?.map((mode) => mode.name)).toEqual(['list', 'id']);
  });

  it('wires the list mode to the resource search method', () => {
    const field = createDynamicIdField({
      fieldName: 'contactId',
      resourceName: 'contact',
      displayName: 'Contact',
    });

    expect(field.modes?.[0].typeOptions?.searchListMethod).toBe('getContacts');
  });

  it('defaults required to false and generates placeholders and descriptions', () => {
    const field = createDynamicIdField({
      fieldName: 'contactPropertyId',
      resourceName: 'contactProperty',
      displayName: 'Contact Property',
    });

    expect(field.required).toBe(false);
    expect(field.modes?.[0].placeholder).toBe('Select contact property...');
    expect(field.modes?.[1].placeholder).toBe('Enter contact property ID...');
    expect(field.description).toContain(
      'Select a contact property or enter an ID',
    );
  });

  it('keeps custom placeholder, description and display options', () => {
    const displayOptions = {
      show: { resource: ['email'], operation: ['send'] },
    };
    const field = createDynamicIdField({
      fieldName: 'templateId',
      resourceName: 'template',
      displayName: 'Template',
      placeholder: 'tmpl_123',
      description: 'Pick a template',
      displayOptions,
    });

    expect(field.modes?.[1].placeholder).toBe('tmpl_123');
    expect(field.description).toBe('Pick a template');
    expect(field.displayOptions).toBe(displayOptions);
  });
});

describe('resolveDynamicIdValue', () => {
  it('reads the value out of the resourceLocator parameter', () => {
    const { context } = createExecuteMock({
      parameters: { templateId: { mode: 'list', value: 'tmpl_123' } },
    });

    expect(resolveDynamicIdValue(context, 'templateId', 0)).toBe('tmpl_123');
  });
});
