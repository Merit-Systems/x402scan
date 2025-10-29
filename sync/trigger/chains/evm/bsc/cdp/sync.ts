import { createChainSyncTask } from '../../../../sync';
import { bscCdpConfig } from './config';

export const bscCdpSyncTransfers = createChainSyncTask(bscCdpConfig);
