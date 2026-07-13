import { createOperationRouter } from '../../transport';

import * as disconnect from './disconnect.operation';

export const execute = createOperationRouter({ disconnect });
