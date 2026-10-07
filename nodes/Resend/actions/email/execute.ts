import { SEND_AND_WAIT_OPERATION } from 'n8n-workflow';
import { createOperationRouter } from '../../transport';
import * as cancel from './cancel.operation';
import * as getAttachment from './getAttachment.operation';
import * as list from './list.operation';
import * as listAttachments from './listAttachments.operation';
import * as retrieve from './retrieve.operation';
import * as send from './send.operation';
import * as sendAndWait from './sendAndWait.operation';
import * as sendBatch from './sendBatch.operation';
import * as share from './share.operation';
import * as update from './update.operation';

export const execute = createOperationRouter(
  {
    send,
    [SEND_AND_WAIT_OPERATION]: sendAndWait,
    sendBatch,
    retrieve,
    update,
    share,
    cancel,
    listAttachments,
    getAttachment,
  },
  { list },
);
