import { buildQuery, transformResponse } from './query';
import {
  Network,
  PaginationStrategy,
  QueryProvider,
  SyncConfig,
} from '@/trigger/types';
import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';

export const polygonChainConfig: SyncConfig = {
  cron: '*/30 * * * *',
  maxDurationInSeconds: 300,
  chain: 'matic',
  facilitators: FACILITATORS_BY_CHAIN(Network.POLYGON),
  enabled: true,
  apiUrl: 'https://streaming.bitquery.io/graphql',
  paginationStrategy: PaginationStrategy.OFFSET,
  provider: QueryProvider.BITQUERY,
  buildQuery,
  transformResponse,
  limit: 20_000,
  machine: 'medium-1x',
};
