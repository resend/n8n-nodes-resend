import { createOperationRouter } from '../../transport';

import * as del from './delete.operation';
import * as forward from './forward.operation';
import * as get from './get.operation';
import * as getEmail from './getEmail.operation';
import * as list from './list.operation';
import * as listEmails from './listEmails.operation';
import * as reply from './reply.operation';
import * as update from './update.operation';

export const execute = createOperationRouter(
  {
    delete: del,
    forward,
    get,
    getEmail,
    reply,
    update,
  },
  { list, listEmails },
);
