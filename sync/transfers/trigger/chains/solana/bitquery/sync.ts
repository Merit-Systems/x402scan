import { createChainSyncTask } from '../../../sync';
import { solanaChainConfig } from './config';

export const solanaSyncTransfers = createChainSyncTask(solanaChainConfig);
