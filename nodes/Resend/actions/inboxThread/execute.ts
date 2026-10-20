import { createOperationRouter } from '../../transport';

import * as addLabels from './addLabels.operation';
import * as del from './delete.operation';
import * as forward from './forward.operation';
import * as get from './get.operation';
import * as getEmail from './getEmail.operation';
import * as list from './list.operation';
import * as listEmails from './listEmails.operation';
import * as removeLabel from './removeLabel.operation';
import * as reply from './reply.operation';
import * as search from './search.operation';
import * as setLabels from './setLabels.operation';
import * as update from './update.operation';

export const execute = createOperationRouter({
  addLabels,
  delete: del,
  forward,
  get,
  getEmail,
  list,
  listEmails,
  removeLabel,
  reply,
  search,
  setLabels,
  update,
});
