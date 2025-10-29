import {
  SyncConfig,
  PaginationStrategy,
  QueryProvider,
  Chain,
} from '@/trigger/types';
import { buildQuery, transformResponse } from './query';
import { ONE_DAY_IN_MS, ONE_MINUTE_IN_SECONDS } from '@/trigger/lib/constants';
import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';

export const solanaBigQueryConfig: SyncConfig = {
  cron: '0 * * * *',
  maxDurationInSeconds: ONE_MINUTE_IN_SECONDS * 10,
  chain: 'solana',
  provider: QueryProvider.BIGQUERY,
  paginationStrategy: PaginationStrategy.TIME_WINDOW,
  timeWindowInMs: ONE_DAY_IN_MS * 30,
  limit: 35_000, // NOTE(shafu): solana could be a lot more!
  facilitators: FACILITATORS_BY_CHAIN(Chain.SOLANA),
  buildQuery,
  transformResponse,
  enabled: false,
  machine: 'small-1x',
};
