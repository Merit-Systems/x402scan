import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';
import type { SyncConfig } from '@/trigger/types';
import { PaginationStrategy, QueryProvider, Network } from '@/trigger/types';
import { buildQuery, transformResponse } from './query';
import { ONE_DAY_IN_MS } from '@/trigger/lib/constants';

export const polygonBigQueryConfig: SyncConfig = {
  cron: '*/30 * * * *',
  maxDurationInSeconds: 300,
  chain: 'polygon',
  provider: QueryProvider.BIGQUERY,
  paginationStrategy: PaginationStrategy.TIME_WINDOW,
  timeWindowInMs: ONE_DAY_IN_MS * 7,
  limit: 20_000,
  facilitators: FACILITATORS_BY_CHAIN(Network.POLYGON),
  buildQuery,
  transformResponse,
  enabled: false,
  machine: 'medium-1x',
};
