import { createChainSyncTask } from '../../../../sync';
import { baseBitqueryConfig } from './config';

export const baseBitquerySyncTransfers =
  createChainSyncTask(baseBitqueryConfig);
