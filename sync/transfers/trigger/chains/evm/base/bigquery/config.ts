import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';
import { createEvmChainConfig } from '@/trigger/fetch/bitquery/query';
import { Network } from '@/trigger/types';

export const baseChainConfig = createEvmChainConfig({
  cron: '*/30 * * * *',
  maxDuration: 1000,
  network: Network.BASE,
  chain: 'base',
  facilitators: FACILITATORS_BY_CHAIN(Network.BASE),
  enabled: false,
});
