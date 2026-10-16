import { createOperationRouter } from '../../transport';

import * as create from './create.operation';
import * as del from './delete.operation';
import * as duplicate from './duplicate.operation';
import * as get from './get.operation';
import * as getRun from './getRun.operation';
import * as list from './list.operation';
import * as listRuns from './listRuns.operation';
import * as stop from './stop.operation';
import * as update from './update.operation';

export const execute = createOperationRouter(
  {
    create,
    get,
    update,
    delete: del,
    duplicate,
    stop,
    listRuns,
    getRun,
  },
  { list },
);
