import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';
import {
  SyncConfig,
  PaginationStrategy,
  QueryProvider,
  Network,
} from '@/trigger/types';
import { buildQuery, transformResponse } from './query';
import { ONE_DAY_IN_MS } from '@/trigger/lib/constants';

export const baseBigQueryConfig: SyncConfig = {
  cron: '*/30 * * * *',
  maxDurationInSeconds: 300,
  chain: 'base',
  provider: QueryProvider.BIGQUERY,
  paginationStrategy: PaginationStrategy.TIME_WINDOW,
  timeWindowInMs: ONE_DAY_IN_MS * 7,
  limit: 20_000,
  facilitators: FACILITATORS_BY_CHAIN(Network.BASE),
  buildQuery,
  transformResponse,
  enabled: false,
  machine: 'medium-1x',
};
