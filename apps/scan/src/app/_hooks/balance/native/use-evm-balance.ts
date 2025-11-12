import { useAccount, useBalance as useBalanceWagmi } from 'wagmi';

import { formatEther } from 'viem';

import { useQueryClient } from '@tanstack/react-query';

import { CHAIN_ID } from '@/types/chain';

import type { Address } from 'viem';
import type { UseBalanceReturnType } from '../types';
import type { SupportedChain } from '@/types/chain';

interface Props {
  address?: Address;
  chain: SupportedChain;
}

export const useEvmNativeBalance = ({
  chain,
  address: addressOverride,
}: Props): UseBalanceReturnType => {
  const queryClient = useQueryClient();

  const { address } = useAccount();

  const addressToQuery = addressOverride ?? address ?? '';

  const result = useBalanceWagmi({
    address: addressToQuery as Address,
    chainId: CHAIN_ID[chain],
  });

  return {
    ...result,
    data: result.data ? parseFloat(formatEther(result.data.value)) : undefined,
    invalidate: () => {
      void queryClient.invalidateQueries({ queryKey: result.queryKey });
    },
  };
};
