import { FACILITATORS_BY_CHAIN } from '@facilitators/config';
import { createEvmChainConfig } from '@/trigger/fetch/bitquery/query';
import { Chain } from '@/trigger/types';

export const bscChainConfig = createEvmChainConfig({
  cron: '*/30 * * * *',
  maxDuration: 1000,
  network: 'bsc',
  chain: 'bsc',
  facilitators: FACILITATORS_BY_CHAIN(Chain.BSC),
  enabled: false,
});
