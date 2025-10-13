import { useAccount, useBalance as useBalanceWagmi } from 'wagmi';
import { base } from 'viem/chains';

export const useEthBalance = () => {
  const { address } = useAccount();

  const result = useBalanceWagmi({
    address: address ?? undefined,
    chainId: base.id,
  });

  return {
    ...result,
    data: result.data
      ? Number(result.data.value) / 10 ** result.data.decimals
      : undefined,
  };
};
