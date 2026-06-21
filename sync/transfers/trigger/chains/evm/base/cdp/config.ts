import { ONE_MINUTE_IN_SECONDS } from '@/trigger/lib/constants';
import type { SyncConfig } from '@/trigger/types';
import { PaginationStrategy, QueryProvider } from '@/trigger/types';
import { buildQuery, transformResponse } from './query';
import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';
import { Network } from '@/trigger/types';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
// Cutover from Bitquery back to CDP. Anchored at the moment Bitquery
// stopped indexing: 2026-06-21 3:20pm ET (EDT, UTC-4) = 19:20 UTC.
const CUTOVER_AT = '2026-06-21T19:20:00.000Z';

export const baseCdpConfig: SyncConfig = {
  cron: '*/5 * * * *',
  maxDurationInSeconds: ONE_MINUTE_IN_SECONDS * 15,
  chain: 'base',
  provider: QueryProvider.CDP,
  apiUrl: 'api.cdp.coinbase.com',
  paginationStrategy: PaginationStrategy.TIME_WINDOW,
  timeWindowInMs: ONE_HOUR_IN_MS,
  limit: 10_000, // NOTE(shafu): 100k is the CDP limit
  facilitators: FACILITATORS_BY_CHAIN(Network.BASE),
  buildQuery,
  transformResponse,
  enabled: true,
  machine: 'medium-1x',
  splitSyncByFacilitator: true,
  useSyncState: true,
  syncStateCutoverAt: new Date(CUTOVER_AT),
};
