import { createChainSyncTask } from '../../../../sync';
import { bscBitqueryConfig } from './config';

export const bscBitquerySyncTransfers = createChainSyncTask(bscBitqueryConfig);
