import { createChainSyncTask } from '../../../../sync';
import { baseBigQueryConfig } from './config';

export const baseBigQuerySyncTransfers =
  createChainSyncTask(baseBigQueryConfig);
