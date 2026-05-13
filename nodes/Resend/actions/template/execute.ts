import { createOperationRouter } from '../../transport';

import * as create from './create.operation';
import * as del from './delete.operation';
import * as duplicate from './duplicate.operation';
import * as get from './get.operation';
import * as list from './list.operation';
import * as publish from './publish.operation';
import * as update from './update.operation';

export const execute = createOperationRouter(
  {
    create,
    get,
    update,
    delete: del,
    publish,
    duplicate,
  },
  { list },
);
