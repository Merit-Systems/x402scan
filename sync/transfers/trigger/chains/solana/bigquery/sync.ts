import { createChainSyncTask } from '../../../sync';
import { solanaBigQueryConfig } from './config';

export const solanaBigQuerySyncTransfers =
  createChainSyncTask(solanaBigQueryConfig);
