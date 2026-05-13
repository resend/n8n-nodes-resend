import { createOperationRouter } from '../../transport';

import * as create from './create.operation';
import * as createTrackingDomain from './createTrackingDomain.operation';
import * as del from './delete.operation';
import * as deleteTrackingDomain from './deleteTrackingDomain.operation';
import * as get from './get.operation';
import * as getTrackingDomain from './getTrackingDomain.operation';
import * as list from './list.operation';
import * as listTrackingDomains from './listTrackingDomains.operation';
import * as update from './update.operation';
import * as verify from './verify.operation';
import * as verifyTrackingDomain from './verifyTrackingDomain.operation';

export const execute = createOperationRouter(
  {
    create,
    get,
    update,
    delete: del,
    verify,
    createTrackingDomain,
    getTrackingDomain,
    listTrackingDomains,
    deleteTrackingDomain,
    verifyTrackingDomain,
  },
  { list },
);
