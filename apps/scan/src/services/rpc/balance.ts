import { env } from '@/env';
import { errAsync, ResultAsync } from 'neverthrow';
import { base } from 'wagmi/chains';
import { createPublicClient, http, erc20Abi, type Address } from 'viem';

export const USDC_DECIMALS = 6;
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export const ERROR_NO_RPC = 'no_rpc';
export const ERROR_RPC_FAILED = 'rpc_failed';

type GetBalanceError =
  | { type: typeof ERROR_NO_RPC; message: string }
  | { type: typeof ERROR_RPC_FAILED; message: string };

export function getBalance(
  address: Address
): ResultAsync<bigint, GetBalanceError> {
  const rpcUrl = env.NEXT_PUBLIC_BASE_RPC_URL;
  if (!rpcUrl) {
    return errAsync({ type: ERROR_NO_RPC, message: 'No RPC URL provided' });
  }
  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
  return ResultAsync.fromPromise(
    client.readContract({
      address: BASE_USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    }),
    (): GetBalanceError => ({
      type: ERROR_RPC_FAILED,
      message: 'RPC balanceOf call failed',
    })
  );
}
