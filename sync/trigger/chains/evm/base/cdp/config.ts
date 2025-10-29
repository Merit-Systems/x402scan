import { ONE_MINUTE_IN_SECONDS } from '@/trigger/lib/constants';
import { SyncConfig, PaginationStrategy, QueryProvider } from '@/trigger/types';
import { buildQuery, transformResponse } from './query';
import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';
import { Chain } from '@/trigger/types';

export const baseCdpConfig: SyncConfig = {
  cron: '*/30 * * * *',
  maxDurationInSeconds: ONE_MINUTE_IN_SECONDS * 10,
  chain: 'base',
  provider: QueryProvider.CDP,
  apiUrl: 'api.cdp.coinbase.com',
  paginationStrategy: PaginationStrategy.OFFSET,
  limit: 100_000, // NOTE(shafu): 100k is the CDP limit
  facilitators: FACILITATORS_BY_CHAIN(Chain.BASE),
  buildQuery,
  transformResponse,
  enabled: true,
  machine: 'medium-1x',
};
