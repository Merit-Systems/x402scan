import { useAccount, useBalance as useBalanceWagmi } from 'wagmi';

import { base } from 'viem/chains';
import { formatEther } from 'viem';

import { useQueryClient } from '@tanstack/react-query';

import type { Address } from 'viem';
import { UseBalanceReturnType } from '../types';
import { CHAIN_ID, SupportedChain } from '@/types/chain';

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
