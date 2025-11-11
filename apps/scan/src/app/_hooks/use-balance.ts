import { useAccount, useBalance as useBalanceWagmi } from 'wagmi';

import { CHAIN_ID } from '@/types/chain';
import { BASE_USDC } from '@/lib/tokens/usdc';

import type { Token } from '@/types/token';
import type { UseBalanceParameters } from 'wagmi';
import type { Address } from 'viem';

export const useBalance = (
  token: Token = BASE_USDC,
  addressOverride?: Address,
  query?: UseBalanceParameters['query']
) => {
  const { address } = useAccount();

  const result = useBalanceWagmi({
    address: addressOverride ?? address ?? undefined,
    token: token.address as `0x${string}`,
    chainId: CHAIN_ID[token.chain],
    query,
  });

  return {
    ...result,
    data: result.data
      ? Number(result.data.value) / 10 ** result.data.decimals
      : undefined,
  };
};
