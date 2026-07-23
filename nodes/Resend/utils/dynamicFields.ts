import type {
  IExecuteFunctions,
  INodeParameterResourceLocator,
  INodeProperties,
} from 'n8n-workflow';

/**
 * Maps resource names to their corresponding API methods for loading dropdown options.
 * Used to dynamically determine which method to call for each resource type.
 */
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

/**
 * Maps resource names to their human-readable display names.
 * Used for generating consistent field labels across the application.
 */
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

/**
 * Configuration options for creating resourceLocator fields.
 */
export interface DynamicIdFieldOptions {
  /** Base name for the field (e.g., 'contactId', 'templateId') */
  fieldName: string;
  /** Resource name (e.g., 'contact', 'template') - must match keys in RESOURCE_METHOD_MAP */
  resourceName: keyof typeof RESOURCE_METHOD_MAP;
  /** Human-readable display name for the field */
  displayName: string;
  /** Whether the field is required */
  required?: boolean;
  /** Placeholder text for the manual input field */
  placeholder?: string;
  /** Additional description for the field */
  description?: string;
  /** Display options to control when fields are shown */
  displayOptions?: INodeProperties['displayOptions'];
}

/**
 * Creates a single resourceLocator field that provides inline dropdown selection and manual input.
 *
 * This function generates a single field with two modes:
 * - 'list' mode: Shows API-populated dropdown for selecting from existing resources
 * - 'id' mode: Shows manual text input for entering IDs directly
 *
 * The field uses n8n's resourceLocator type for inline mode switching.
 *
 * @param options Configuration options for the resourceLocator field
 * @returns Single INodeProperties representing the resourceLocator field
 *
 * @example
 * ```typescript
 * // Create resourceLocator field for template selection
 * const templateField = createDynamicIdField({
 *   fieldName: 'templateId',
 *   resourceName: 'template',
 *   displayName: 'Template',
 *   required: true,
 *   placeholder: '34a080c9-b17d-4187-ad80-5af20266e535',
 *   description: 'The template to use for this operation',
 *   displayOptions: {
 *     show: {
 *       resource: ['email'],
 *       operation: ['send']
 *     }
 *   }
 * });
 * ```
 */
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

  // Get the display name for the resource
  const resourceDisplayName = RESOURCE_DISPLAY_MAP[resourceName];

  // Get the method name for loading options
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

/**
 * Resolves the actual ID value from a resourceLocator field during workflow execution.
 *
 * This helper function extracts the ID value from the resourceLocator structure
 * based on the selected mode and returns the appropriate value for use in API calls.
 *
 * @param executeFunctions The n8n execution context
 * @param fieldName Field name used when creating the resourceLocator field
 * @param index Current item index in the workflow execution
 * @returns The resolved ID value as a string
 *
 * @example
 * ```typescript
 * // In an operation's execute function
 * export async function execute(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
 *   const templateId = resolveDynamicIdValue(this, 'templateId', index);
 *
 *   const response = await apiRequest.call(this, 'GET', `/templates/${templateId}`);
 *   return [{ json: response }];
 * }
 * ```
 */
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
