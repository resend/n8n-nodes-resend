import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Contact Import ID',
    name: 'contactImportId',
    type: 'string',
    required: true,
    default: '',
    placeholder: '479e3145-dd38-476b-932c-529ceb705947',
    displayOptions: {
      show: {
        resource: ['contacts'],
        operation: ['getImport'],
      },
    },
    description:
      'The unique identifier of the contact import. Returns its status, creation and completion timestamps, and the counts of created, updated, skipped, and failed rows.',
  },
];

export async function execute(
  this: IExecuteFunctions,
  index: number,
): Promise<INodeExecutionData[]> {
  const contactImportId = this.getNodeParameter(
    'contactImportId',
    index,
  ) as string;

  const response = await apiRequest.call(
    this,
    'GET',
    `/contacts/imports/${encodeURIComponent(contactImportId)}`,
  );

  return [{ json: response, pairedItem: { item: index } }];
}
