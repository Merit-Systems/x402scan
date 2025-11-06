import { Chain, CHAIN_TO_VIEM_CHAIN, EvmChain } from '@/types/chain';
import { createPublicClient, http, HttpTransport } from 'viem';
import { base, optimism, polygon } from 'viem/chains';

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
