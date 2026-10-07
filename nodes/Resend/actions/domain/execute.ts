import { createOperationRouter } from '../../transport';

import * as claim from './claim.operation';
import * as create from './create.operation';
import * as del from './delete.operation';
import * as get from './get.operation';
import * as getClaim from './getClaim.operation';
import * as list from './list.operation';
import * as update from './update.operation';
import * as verify from './verify.operation';
import * as verifyClaim from './verifyClaim.operation';

export const execute = createOperationRouter(
  {
    claim,
    create,
    get,
    getClaim,
    update,
    delete: del,
    verify,
    verifyClaim,
  },
  { list },
);
