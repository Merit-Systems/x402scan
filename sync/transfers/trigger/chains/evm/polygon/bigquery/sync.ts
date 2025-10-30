import { createChainSyncTask } from '../../../../sync';
import { polygonBigQueryConfig } from './config';

export const polygonBigQuerySyncTransfers = createChainSyncTask(
  polygonBigQueryConfig
);
