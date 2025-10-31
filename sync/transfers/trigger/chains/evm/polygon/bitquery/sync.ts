import { createChainSyncTask } from '../../../../sync';
import { polygonChainConfig } from './config';

export const polygonSyncTransfers = createChainSyncTask(polygonChainConfig);
