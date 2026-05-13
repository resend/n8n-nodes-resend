import { createOperationRouter } from '../../transport';

import * as list from './list.operation';
import * as retrieve from './retrieve.operation';

export const execute = createOperationRouter({ retrieve }, { list });
