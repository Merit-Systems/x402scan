import { USDC_ADDRESS } from '@/lib/utils';
import { useAccount, useBalance as useBalanceWagmi } from 'wagmi';
import { base } from 'viem/chains';
import { Chain } from '@/types/chain';

export const useBalance = () => {
  const { address } = useAccount();

  const result = useBalanceWagmi({
    address: address ?? undefined,
    token: USDC_ADDRESS[Chain.BASE] as `0x${string}`,
    chainId: base.id,
  });

  return {
    ...result,
    data: result.data
      ? Number(result.data.value) / 10 ** result.data.decimals
      : undefined,
  };
};
