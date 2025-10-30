import { createChainSyncTask } from '../../../../sync';
import { baseCdpConfig } from './config';

export const baseCdpSyncTransfers = createChainSyncTask(baseCdpConfig);
