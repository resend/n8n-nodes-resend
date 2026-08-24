import { createOperationRouter } from '../../transport';

import * as cancel from './cancel.operation';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as getMetrics from './getMetrics.operation';
import * as list from './list.operation';
import * as send from './send.operation';
import * as update from './update.operation';

export const execute = createOperationRouter(
  {
    create,
    get,
    update,
    delete: del,
    send,
    cancel,
    getMetrics,
  },
  { list },
);
