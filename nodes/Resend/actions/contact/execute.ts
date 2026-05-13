import { createOperationRouter } from '../../transport';
import * as addToSegment from './addToSegment.operation';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as getTopics from './getTopics.operation';
import * as list from './list.operation';
import * as listSegments from './listSegments.operation';
import * as removeFromSegment from './removeFromSegment.operation';
import * as update from './update.operation';
import * as updateTopics from './updateTopics.operation';

export const execute = createOperationRouter(
  {
    create,
    get,
    update,
    delete: del,
    addToSegment,
    listSegments,
    removeFromSegment,
    getTopics,
    updateTopics,
  },
  { list },
);
