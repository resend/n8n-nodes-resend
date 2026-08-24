import { createOperationRouter } from '../../transport';

import * as disconnect from './disconnect.operation';
import * as listGrants from './listGrants.operation';
import * as revokeGrant from './revokeGrant.operation';

export const execute = createOperationRouter(
  { disconnect, revokeGrant },
  { listGrants },
);
