import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';
import { ONE_MINUTE_IN_SECONDS } from '@/trigger/lib/constants';
import type { SyncConfig } from '@/trigger/types';
import { Network, PaginationStrategy, QueryProvider } from '@/trigger/types';
import { buildQuery, transformResponse } from './query';

export const baseBitqueryConfig: SyncConfig = {
  cron: '*/5 * * * *',
  maxDurationInSeconds: ONE_MINUTE_IN_SECONDS * 15,
  chain: 'base',
  provider: QueryProvider.BITQUERY,
  apiUrl: 'https://streaming.bitquery.io/graphql',
  paginationStrategy: PaginationStrategy.OFFSET,
  limit: 25_000,
  facilitators: FACILITATORS_BY_CHAIN(Network.BASE),
  buildQuery,
  transformResponse,
  enabled: true,
  machine: 'medium-1x',
  splitSyncByFacilitator: true,
  resumeFromProviders: [QueryProvider.CDP, QueryProvider.BITQUERY],
  saveOffsetPagesIncrementally: true,
};
