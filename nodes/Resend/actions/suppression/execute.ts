import { createOperationRouter } from '../../transport';

import * as batchAdd from './batchAdd.operation';
import * as batchRemove from './batchRemove.operation';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as list from './list.operation';

export const execute = createOperationRouter(
  {
    create,
    get,
    delete: del,
    batchAdd,
    batchRemove,
  },
  { list },
);
