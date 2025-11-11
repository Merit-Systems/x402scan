import { createChainSyncTask } from '../../../../sync';
import { avalancheChainConfig } from './config';

export const avalancheBitquerySyncTransfers =
  createChainSyncTask(avalancheChainConfig);
