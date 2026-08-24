import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { apiRequestMultipart } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Input Data Field Name',
    name: 'contactImportBinaryProperty',
    type: 'string',
    required: true,
    default: 'data',
    placeholder: 'data',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['createImport'],
      },
    },
    description:
      'The name of the input binary field holding the CSV file to import. See the <a href="https://resend.com/docs/api-reference/contacts/create-contact-import">Resend contact import docs</a> for the current maximum file size.',
  },
  {
    displayName: 'Import Fields',
    name: 'contactImportFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['createImport'],
      },
    },
    options: [
      {
        displayName: 'Column Map (JSON)',
        name: 'columnMap',
        type: 'json',
        default: '',
        placeholder:
          '{"email":"Email","first_name":"First Name","properties":{"plan":{"column":"Plan","type":"string"}}}',
        description:
          'Maps CSV columns to contact fields, as a JSON object. Supports email, first_name, last_name, unsubscribed, and properties. Each custom property maps to an object with a required column and an optional type of string, number, or boolean, which defaults to string.',
      },
      {
        displayName: 'File Name',
        name: 'fileName',
        type: 'string',
        default: '',
        placeholder: 'contacts.csv',
        description:
          'The file name sent to Resend. Defaults to the file name of the input binary field.',
      },
      {
        displayName: 'On Conflict',
        name: 'onConflict',
        type: 'options',
        default: 'skip',
        description: 'How to handle contacts that already exist',
        options: [
          {
            name: 'Create or Update',
            value: 'upsert',
            description:
              'Create a new record, or update the current one if it already exists (upsert)',
          },
          {
            name: 'Skip',
            value: 'skip',
            description: 'Leave the existing contact untouched',
          },
        ],
      },
      {
        displayName: 'Segments',
        name: 'segments',
        type: 'fixedCollection',
        default: { segments: [] },
        typeOptions: {
          multipleValues: true,
        },
        description: 'The segments to add the imported contacts to',
        options: [
          {
            name: 'segments',
            displayName: 'Segment',
            values: [
              {
                displayName: 'Segment Name or ID',
                name: 'id',
                type: 'options',
                required: true,
                default: '',
                typeOptions: {
                  loadOptionsMethod: 'getSegments',
                },
                description:
                  'The segment to add the imported contacts to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Topics',
        name: 'topics',
        type: 'fixedCollection',
        default: { topics: [] },
        typeOptions: {
          multipleValues: true,
        },
        description: 'Topic subscriptions to apply to the imported contacts',
        options: [
          {
            name: 'topics',
            displayName: 'Topic',
            values: [
              {
                displayName: 'Topic Name or ID',
                name: 'id',
                type: 'options',
                required: true,
                default: '',
                typeOptions: {
                  loadOptionsMethod: 'getTopics',
                },
                description:
                  'The subscription topic. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
              },
              {
                displayName: 'Subscription',
                name: 'subscription',
                type: 'options',
                default: 'opt_in',
                description:
                  'Whether the imported contacts are subscribed (opt_in) or unsubscribed (opt_out) from this topic',
                options: [
                  {
                    name: 'Opt In',
                    value: 'opt_in',
                    description:
                      'Contact wants to receive emails on this topic',
                  },
                  {
                    name: 'Opt Out',
                    value: 'opt_out',
                    description: 'Contact does not want emails on this topic',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const TOPIC_SUBSCRIPTIONS = ['opt_in', 'opt_out'];

function isPlainObject(value: unknown): value is IDataObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredId(entry: unknown): string | undefined {
  if (!isPlainObject(entry)) return undefined;
  const id = entry.id;
  if (typeof id !== 'string') return undefined;
  const trimmed = id.trim();
  return trimmed ? trimmed : undefined;
}

function parseColumnMap(
  this: IExecuteFunctions,
  value: unknown,
  index: number,
): IDataObject | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  let parsed: unknown = value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new NodeOperationError(
        this.getNode(),
        'Column Map must be valid JSON, for example {"email":"Email","first_name":"First Name"}',
        { itemIndex: index },
      );
    }
  }

  if (!isPlainObject(parsed)) {
    throw new NodeOperationError(
      this.getNode(),
      'Column Map must be a JSON object mapping contact fields to CSV column names, for example {"email":"Email","first_name":"First Name"}',
      { itemIndex: index },
    );
  }

  return parsed;
}

function readEntries(
  this: IExecuteFunctions,
  value: unknown,
  fieldName: string,
  index: number,
): unknown[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new NodeOperationError(
      this.getNode(),
      `${fieldName} must be an array of objects`,
      { itemIndex: index },
    );
  }
  return value;
}

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const binaryPropertyName = this.getNodeParameter(
    'contactImportBinaryProperty',
    index,
    'data',
  ) as string;
  const importFields = this.getNodeParameter(
    'contactImportFields',
    index,
    {},
  ) as {
    columnMap?: unknown;
    fileName?: string;
    onConflict?: string;
    segments?: { segments?: unknown };
    topics?: { topics?: unknown };
  };

  const items = this.getInputData();
  const binaryData = items[index]?.binary?.[binaryPropertyName];
  if (!binaryData) {
    throw new NodeOperationError(
      this.getNode(),
      `Binary property "${binaryPropertyName}" not found in item ${index}`,
      { itemIndex: index },
    );
  }

  const buffer = await this.helpers.getBinaryDataBuffer(
    index,
    binaryPropertyName,
  );

  const fileName =
    importFields.fileName || binaryData.fileName || 'contacts.csv';

  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(buffer)], {
      type: binaryData.mimeType || 'text/csv',
    }),
    fileName,
  );

  const columnMap = parseColumnMap.call(this, importFields.columnMap, index);
  if (columnMap) {
    form.append('column_map', JSON.stringify(columnMap));
  }

  if (importFields.onConflict) {
    form.append('on_conflict', importFields.onConflict);
  }

  const segments = readEntries.call(
    this,
    importFields.segments?.segments,
    'Segments',
    index,
  );
  if (segments.length) {
    form.append(
      'segments',
      JSON.stringify(
        segments.map((segment) => {
          const id = readRequiredId(segment);
          if (!id) {
            throw new NodeOperationError(
              this.getNode(),
              'Every entry in Segments must be an object with a non-empty "id", for example [{"id":"78261eea-8f8b-4381-83c6-79fa7120f1cf"}]',
              { itemIndex: index },
            );
          }
          return { id };
        }),
      ),
    );
  }

  const topics = readEntries.call(
    this,
    importFields.topics?.topics,
    'Topics',
    index,
  );
  if (topics.length) {
    form.append(
      'topics',
      JSON.stringify(
        topics.map((topic) => {
          const id = readRequiredId(topic);
          if (!id) {
            throw new NodeOperationError(
              this.getNode(),
              'Every entry in Topics must be an object with a non-empty "id", for example [{"id":"b6d24b8e-af0b-4c3c-be0c-359bbd97381e","subscription":"opt_in"}]',
              { itemIndex: index },
            );
          }
          const subscription = isPlainObject(topic)
            ? topic.subscription
            : undefined;
          if (
            typeof subscription !== 'string' ||
            !TOPIC_SUBSCRIPTIONS.includes(subscription)
          ) {
            throw new NodeOperationError(
              this.getNode(),
              `Topic "${id}" must have a subscription of either "opt_in" or "opt_out"`,
              { itemIndex: index },
            );
          }
          return { id, subscription };
        }),
      ),
    );
  }

  const response = await apiRequestMultipart.call(
    this,
    'POST',
    '/contacts/imports',
    form,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
