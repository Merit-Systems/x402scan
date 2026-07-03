import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';
import { ONE_MINUTE_IN_SECONDS } from '@/trigger/lib/constants';
import type { SyncConfig } from '@/trigger/types';
import { Network, PaginationStrategy, QueryProvider } from '@/trigger/types';
import { buildQuery, transformResponse } from './query';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const DEFAULT_CUTOVER_AT = '2026-06-09T18:00:00.000Z'; // switch from CDP to Bitquery

export const baseBitqueryConfig: SyncConfig = {
  cron: '*/5 * * * *',
  maxDurationInSeconds: ONE_MINUTE_IN_SECONDS * 15,
  chain: 'base',
  provider: QueryProvider.BITQUERY,
  apiUrl: 'https://streaming.bitquery.io/graphql',
  paginationStrategy: PaginationStrategy.TIME_WINDOW,
  timeWindowInMs: ONE_HOUR_IN_MS,
  limit: 25_000,
  facilitators: FACILITATORS_BY_CHAIN(Network.BASE),
  buildQuery,
  transformResponse,
  enabled: true,
  machine: 'medium-1x',
  splitSyncByFacilitator: true,
  useSyncState: true,
  syncStateCutoverAt: new Date(DEFAULT_CUTOVER_AT),
};
