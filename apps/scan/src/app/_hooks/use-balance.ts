import {
  useAccount,
  UseBalanceParameters,
  useBalance as useBalanceWagmi,
} from 'wagmi';
import { CHAIN_ID } from '@/types/chain';
import { Token } from '@/types/token';
import { BASE_USDC } from '@/lib/tokens/usdc';

export const useBalance = (
  token: Token = BASE_USDC,
  query?: UseBalanceParameters['query']
) => {
  const { address } = useAccount();

  const result = useBalanceWagmi({
    address: address ?? undefined,
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
