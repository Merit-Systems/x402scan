import { useAccount, useBalance as useBalanceWagmi } from 'wagmi';

import { useQueryClient } from '@tanstack/react-query';

import { CHAIN_ID } from '@/types/chain';
import { BASE_USDC } from '@/lib/tokens/usdc';

import type { Token } from '@/types/token';
import type { UseBalanceParameters } from 'wagmi';
import type { Address } from 'viem';
import type { UseBalanceReturnType } from '../types';

interface Props {
  token?: Token;
  address?: Address;
  query?: UseBalanceParameters['query'];
}

export const useEvmTokenBalance = (props?: Props): UseBalanceReturnType => {
  const queryClient = useQueryClient();

  const { token = BASE_USDC, address: addressOverride, query } = props ?? {};

  const { address } = useAccount();

  const addressToQuery = addressOverride ?? address ?? undefined;

  const result = useBalanceWagmi({
    address: addressToQuery,
    token: token.address as Address,
    chainId: CHAIN_ID[token.chain],
    query,
  });

  return {
    ...result,
    data: result.data
      ? Number(result.data.value) / 10 ** result.data.decimals
      : undefined,
    invalidate: () => {
      void queryClient.invalidateQueries({ queryKey: result.queryKey });
    },
  };
};
