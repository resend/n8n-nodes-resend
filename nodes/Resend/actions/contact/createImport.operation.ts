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
      'The name of the input binary field holding the CSV file to import. Maximum size is 50MB.',
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
          'JSON-encoded object mapping contact fields and custom property keys to CSV column names. Supports email, first_name, last_name, unsubscribed, and properties. Custom property mappings can include type as string, number, or boolean; defaults to string.',
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
        description: 'Strategy to use when an imported contact already exists',
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
        description: 'Segments to add every imported contact to',
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
        description: 'Topic subscriptions to apply to every imported contact',
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

interface SegmentItem {
  id: string;
}

interface TopicItem {
  id: string;
  subscription: string;
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
    columnMap?: string | IDataObject;
    fileName?: string;
    onConflict?: string;
    segments?: { segments: SegmentItem[] };
    topics?: { topics: TopicItem[] };
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

  const columnMap = importFields.columnMap;
  if (columnMap) {
    if (typeof columnMap === 'string') {
      const trimmed = columnMap.trim();
      if (trimmed) {
        try {
          JSON.parse(trimmed);
        } catch {
          throw new NodeOperationError(
            this.getNode(),
            'Column Map must be a valid JSON object',
            { itemIndex: index },
          );
        }
        form.append('column_map', trimmed);
      }
    } else if (typeof columnMap === 'object') {
      form.append('column_map', JSON.stringify(columnMap));
    }
  }

  if (importFields.onConflict) {
    form.append('on_conflict', importFields.onConflict);
  }

  if (importFields.segments?.segments?.length) {
    form.append(
      'segments',
      JSON.stringify(
        importFields.segments.segments.map((segment) => ({ id: segment.id })),
      ),
    );
  }

  if (importFields.topics?.topics?.length) {
    form.append(
      'topics',
      JSON.stringify(
        importFields.topics.topics.map((topic) => ({
          id: topic.id,
          subscription: topic.subscription,
        })),
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
