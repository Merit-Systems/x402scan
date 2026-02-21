import { Chain } from '@/types/chain';
import { SIWE_PROVIDER_ID } from './siwe/constants';
import { SIWS_PROVIDER_ID } from './siws/constants';
import { SIWA_PROVIDER_ID } from './siwa/constants';

export const chainToAuthProviderId: Record<Chain, string> = {
  [Chain.BASE]: SIWE_PROVIDER_ID,
  [Chain.POLYGON]: SIWE_PROVIDER_ID,
  [Chain.OPTIMISM]: SIWE_PROVIDER_ID,
  [Chain.SOLANA]: SIWS_PROVIDER_ID,
  [Chain.ALGORAND]: SIWA_PROVIDER_ID,
};
