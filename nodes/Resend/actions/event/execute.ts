import { createOperationRouter } from '../../transport';

import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as list from './list.operation';
import * as send from './send.operation';
import * as update from './update.operation';

export const execute = createOperationRouter(
  {
    create,
    send,
    get,
    update,
    delete: del,
  },
  { list },
);
