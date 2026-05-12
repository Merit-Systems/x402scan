import { ONE_MINUTE_IN_SECONDS } from '@/trigger/lib/constants';
import type { SyncConfig } from '../../../types';
import { PaginationStrategy, QueryProvider, Network } from '../../../types';
import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';
import { buildQuery, transformResponse } from './query';

export const solanaChainConfig: SyncConfig = {
  cron: '*/30 * * * *',
  maxDurationInSeconds: ONE_MINUTE_IN_SECONDS * 30,
  chain: 'solana',
  provider: QueryProvider.BITQUERY,
  apiUrl: 'https://graphql.bitquery.io',
  paginationStrategy: PaginationStrategy.OFFSET,
  limit: 10_000, // NOTE(shafu): more than that and bitquery 503
  facilitators: FACILITATORS_BY_CHAIN(Network.SOLANA),
  buildQuery,
  transformResponse,
  enabled: true,
  machine: 'large-2x',
};
