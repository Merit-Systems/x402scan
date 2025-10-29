import { ONE_DAY_IN_MS, ONE_MINUTE_IN_SECONDS } from '@facilitators/constants';
import { SyncConfig, PaginationStrategy, QueryProvider } from '@/trigger/types';
import { buildQuery, transformResponse } from './query';
import { FACILITATORS_BY_CHAIN } from '@facilitators/config';
import { Chain } from '@/trigger/types';

export const bscCdpConfig: SyncConfig = {
  cron: '* * * * *',
  maxDurationInSeconds: ONE_MINUTE_IN_SECONDS * 10,
  chain: 'bsc',
  provider: QueryProvider.CDP,
  apiUrl: 'api.cdp.coinbase.com',
  paginationStrategy: PaginationStrategy.TIME_WINDOW,
  timeWindowInMs: ONE_DAY_IN_MS * 7,
  limit: 40_000, // NOTE(shafu): 20_000 is not enough
  facilitators: FACILITATORS_BY_CHAIN(Chain.BSC),
  buildQuery,
  transformResponse,
  enabled: true,
};
