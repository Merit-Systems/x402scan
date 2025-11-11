import { ONE_MINUTE_IN_SECONDS } from '@/trigger/lib/constants';
import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';
import {
  Network,
  PaginationStrategy,
  QueryProvider,
  SyncConfig,
} from '@/trigger/types';
import { buildQuery, transformResponse } from './query';

export const avalancheChainConfig: SyncConfig = {
  cron: '*/30 * * * *',
  maxDurationInSeconds: ONE_MINUTE_IN_SECONDS * 10,
  chain: 'base',
  provider: QueryProvider.BITQUERY,
  paginationStrategy: PaginationStrategy.OFFSET,
  limit: 100_000,
  facilitators: FACILITATORS_BY_CHAIN(Network.AVALANCHE),
  buildQuery,
  transformResponse,
  enabled: true,
  machine: 'medium-1x',
};
