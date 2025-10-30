import { FACILITATORS_BY_CHAIN } from '@facilitators/config';
import { SyncConfig, PaginationStrategy, QueryProvider, Chain } from '@/trigger/types';
import { buildQuery, transformResponse } from './query';

export const bscBitqueryConfig: SyncConfig = {
  cron: '*/30 * * * *',
  maxDurationInSeconds: 300,
  chain: 'bsc',
  provider: QueryProvider.BITQUERY,
  apiUrl: 'https://streaming.bitquery.io/graphql',
  paginationStrategy: PaginationStrategy.TIME_WINDOW,
  timeWindowInMs: 7 * 24 * 60 * 60 * 1000, // 1 week
  limit: 20_000,
  facilitators: FACILITATORS_BY_CHAIN(Chain.BSC),
  buildQuery,
  transformResponse,
  enabled: true,
};
