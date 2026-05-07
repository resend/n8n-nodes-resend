import { createOperationRouter } from '../../transport';

import * as create from './create.operation';
import * as get from './get.operation';
import * as list from './list.operation';
import * as listContacts from './listContacts.operation';
import * as del from './delete.operation';

export const execute = createOperationRouter(
	{
		create,
		get,
		delete: del,
	},
	{ list, listContacts },
);
