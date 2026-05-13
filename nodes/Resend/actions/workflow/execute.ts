import { createOperationRouter } from '../../transport';

import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as getRun from './getRun.operation';
import * as getRunStep from './getRunStep.operation';
import * as list from './list.operation';
import * as listRunSteps from './listRunSteps.operation';
import * as listRuns from './listRuns.operation';
import * as update from './update.operation';

export const execute = createOperationRouter(
  {
    create,
    get,
    update,
    delete: del,
    listRuns,
    getRun,
    listRunSteps,
    getRunStep,
  },
  { list },
);
