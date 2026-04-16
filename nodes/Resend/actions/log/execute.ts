import { createOperationRouter } from '../../transport';

import * as get from './get.operation';
import * as list from './list.operation';

export const execute = createOperationRouter(
	{
		get,
	},
	{ list },
);
