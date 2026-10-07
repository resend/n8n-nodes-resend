import { createOperationRouter } from '../../transport';

import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as getEvent from './getEvent.operation';
import * as list from './list.operation';
import * as listEventAttempts from './listEventAttempts.operation';
import * as listEvents from './listEvents.operation';
import * as replayEvent from './replayEvent.operation';
import * as rotateSigningSecret from './rotateSigningSecret.operation';
import * as update from './update.operation';

export const execute = createOperationRouter(
  {
    create,
    get,
    update,
    delete: del,
    rotateSigningSecret,
    getEvent,
    replayEvent,
    listEvents,
    listEventAttempts,
  },
  { list },
);
