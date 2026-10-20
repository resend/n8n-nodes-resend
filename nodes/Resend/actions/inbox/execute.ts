import { createOperationRouter } from '../../transport';

import * as create from './create.operation';
import * as createLabel from './createLabel.operation';
import * as del from './delete.operation';
import * as deleteLabel from './deleteLabel.operation';
import * as get from './get.operation';
import * as getAgent from './getAgent.operation';
import * as list from './list.operation';
import * as listLabels from './listLabels.operation';
import * as update from './update.operation';
import * as updateAgent from './updateAgent.operation';
import * as updateLabel from './updateLabel.operation';

export const execute = createOperationRouter(
  {
    create,
    get,
    update,
    delete: del,
    getAgent,
    updateAgent,
    createLabel,
    listLabels,
    updateLabel,
    deleteLabel,
  },
  { list },
);
