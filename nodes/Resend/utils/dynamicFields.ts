import type {
  IExecuteFunctions,
  INodeParameterResourceLocator,
  INodeProperties,
} from 'n8n-workflow';

export const RESOURCE_METHOD_MAP = {
  broadcast: 'getBroadcasts',
  contact: 'getContacts',
  domain: 'getDomains',
  webhook: 'getWebhooks',
  contactProperty: 'getContactProperties',
  email: 'getEmails',
  receivedEmail: 'getReceivedEmails',
  segment: 'getSegments',
  suppression: 'getSuppressions',
  template: 'getTemplates',
  topic: 'getTopics',
} as const;

export const RESOURCE_DISPLAY_MAP = {
  broadcast: 'Broadcast',
  contact: 'Contact',
  domain: 'Domain',
  webhook: 'Webhook',
  contactProperty: 'Contact Property',
  email: 'Email',
  receivedEmail: 'Received Email',
  segment: 'Segment',
  suppression: 'Suppression',
  template: 'Template',
  topic: 'Topic',
} as const;

export interface DynamicIdFieldOptions {
  fieldName: string;
  resourceName: keyof typeof RESOURCE_METHOD_MAP;
  displayName: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  displayOptions?: INodeProperties['displayOptions'];
}

export function createDynamicIdField(
  options: DynamicIdFieldOptions,
): INodeProperties {
  const {
    fieldName,
    resourceName,
    displayName,
    required = false,
    placeholder,
    description,
    displayOptions,
  } = options;

  const resourceDisplayName = RESOURCE_DISPLAY_MAP[resourceName];

  const methodName = RESOURCE_METHOD_MAP[resourceName];

  return {
    displayName,
    name: fieldName,
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required,
    displayOptions,
    description:
      description ||
      `Select a ${resourceDisplayName.toLowerCase()} or enter an ID directly. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.`,
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        placeholder: `Select ${resourceDisplayName.toLowerCase()}...`,
        typeOptions: {
          searchListMethod: methodName,
        },
      },
      {
        displayName: 'By ID',
        name: 'id',
        type: 'string',
        placeholder:
          placeholder || `Enter ${resourceDisplayName.toLowerCase()} ID...`,
      },
    ],
  };
}

export function resolveDynamicIdValue(
  executeFunctions: IExecuteFunctions,
  fieldName: string,
  index: number,
): string {
  const resourceLocator = executeFunctions.getNodeParameter(
    fieldName,
    index,
  ) as INodeParameterResourceLocator;
  return resourceLocator.value as string;
}
