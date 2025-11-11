import { Chain } from '@/types/chain';
import { createPublicClient, http } from 'viem';
import { base, optimism, polygon } from 'viem/chains';

import type { HttpTransport } from 'viem';
import type { CHAIN_TO_VIEM_CHAIN, EvmChain } from '@/types/chain';

type EvmRpc = {
  [K in EvmChain]: ReturnType<
    typeof createPublicClient<
      HttpTransport<undefined, false>,
      (typeof CHAIN_TO_VIEM_CHAIN)[K]
    >
  >;
};

export const evmRpc: EvmRpc = {
  [Chain.BASE]: createPublicClient({
    chain: base,
    transport: http(),
  }),
  [Chain.POLYGON]: createPublicClient({
    chain: polygon,
    transport: http(),
  }),
  [Chain.OPTIMISM]: createPublicClient({
    chain: optimism,
    transport: http(),
  }),
};
