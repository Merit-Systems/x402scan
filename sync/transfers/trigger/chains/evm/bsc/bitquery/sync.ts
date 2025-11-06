import { createChainSyncTask } from '../../../../sync';
import { bscChainConfig } from './config';

export const bscSyncTransfers = createChainSyncTask(bscChainConfig);
