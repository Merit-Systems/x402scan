import { createChainSyncTask } from '../../../../sync';
import { baseChainConfig } from './config';

export const baseSyncTransfers = createChainSyncTask(baseChainConfig);
