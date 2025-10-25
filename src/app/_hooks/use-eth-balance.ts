import { useAccount, useBalance as useBalanceWagmi } from 'wagmi';
import { base } from 'viem/chains';
import { formatEther } from 'viem';

export const useEthBalance = () => {
  const { address } = useAccount();

  const result = useBalanceWagmi({
    address: address ?? undefined,
    chainId: base.id,
  });

  return {
    ...result,
    data: result.data ? parseFloat(formatEther(result.data.value)) : undefined,
  };
};
