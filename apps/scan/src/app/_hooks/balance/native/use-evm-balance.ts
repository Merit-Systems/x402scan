import { useAccount, useBalance as useBalanceWagmi } from 'wagmi';

import { base } from 'viem/chains';
import { formatEther } from 'viem';

import { useQueryClient } from '@tanstack/react-query';

import type { Address } from 'viem';
import { UseBalanceReturnType } from '../types';

interface Props {
  address?: Address;
}

export const useEthBalance = (props?: Props): UseBalanceReturnType => {
  const queryClient = useQueryClient();

  const { address: addressOverride } = props ?? {};

  const { address } = useAccount();

  const addressToQuery = addressOverride ?? address ?? undefined;

  const result = useBalanceWagmi({
    address: addressToQuery,
    chainId: base.id,
  });

  return {
    ...result,
    data: result.data ? parseFloat(formatEther(result.data.value)) : undefined,
    invalidate: () => {
      void queryClient.invalidateQueries({ queryKey: result.queryKey });
    },
  };
};
