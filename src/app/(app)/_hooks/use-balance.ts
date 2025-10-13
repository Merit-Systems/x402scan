import { USDC_ADDRESS } from '@/lib/utils';
import { useAccount, useBalance as useBalanceWagmi } from 'wagmi';
import { base } from 'viem/chains';

export const useBalance = () => {
  const { address } = useAccount();

  const result = useBalanceWagmi({
    address: address ?? undefined,
    token: USDC_ADDRESS,
    chainId: base.id,
  });

  return {
    ...result,
    data: result.data
      ? Number(result.data.value) / 10 ** result.data.decimals
      : undefined,
  };
};
