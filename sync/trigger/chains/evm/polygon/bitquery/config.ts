import { createEvmChainConfig } from '../../../../fetch/bitquery/query';
import { Network } from '@/trigger/types';
import { FACILITATORS_BY_CHAIN } from '@/trigger/lib/facilitators';

export const polygonChainConfig = createEvmChainConfig({
  cron: '*/30 * * * *',
  maxDuration: 1000,
  network: 'polygon',
  chain: 'matic',
  facilitators: FACILITATORS_BY_CHAIN(Network.POLYGON),
  enabled: false,
});
