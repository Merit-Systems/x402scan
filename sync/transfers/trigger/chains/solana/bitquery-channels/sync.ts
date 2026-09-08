import { createChainSyncTask } from '../../../sync';
import { solanaChannelsChainConfig } from './config';

export const solanaChannelsSyncTransfers = createChainSyncTask(
  solanaChannelsChainConfig
);
