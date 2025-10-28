import { createEvmChainConfig } from '../../../../fetch/bitquery/query';
import { Chain } from '@/trigger/types';
import { FACILITATORS_BY_CHAIN } from '@facilitators/config';

export const polygonChainConfig = createEvmChainConfig({
  cron: '*/30 * * * *',
  maxDuration: 1000,
  network: 'polygon',
  chain: 'matic',
  facilitators: FACILITATORS_BY_CHAIN(Chain.POLYGON),
  enabled: false,
});
