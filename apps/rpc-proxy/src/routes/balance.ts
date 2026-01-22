import type { Context, Hono } from 'hono';
import type { Address } from 'viem';

import {
  createPublicClient,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  isAddress,
} from 'viem';
import { base } from 'viem/chains';

import { errAsync, ResultAsync } from 'neverthrow';

const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6;
const USDC_SYMBOL = 'USDC';
const BASE_CHAIN = base;

const ERROR_NO_RPC = 'no_rpc';
const ERROR_RPC_FAILED = 'rpc_failed';

type GetBalanceError =
  | { type: typeof ERROR_NO_RPC; message: string }
  | { type: typeof ERROR_RPC_FAILED; message: string };

function getBalance(address: Address): ResultAsync<bigint, GetBalanceError> {
  const rpcUrl = process.env.BASE_RPC_URL;
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

async function balanceHandler(c: Context) {
  const addressParam = c.req.param('address');
  if (!isAddress(addressParam)) {
    return c.json({ error: 'Invalid EVM address' }, 400);
  }
  const address = getAddress(addressParam);

  return await getBalance(address).match(
    balance =>
      c.json({
        chain: BASE_CHAIN.id,
        address,
        balance: formatUnits(balance, USDC_DECIMALS),
        rawBalance: balance.toString(),
        token: {
          symbol: USDC_SYMBOL,
          decimals: USDC_DECIMALS,
          address: BASE_USDC_ADDRESS,
        },
      }),
    error => {
      switch (error.type) {
        case ERROR_NO_RPC:
          return c.json({ error: error.message }, 503);
        case ERROR_RPC_FAILED:
          return c.json({ error: error.message }, 502);
        default:
          return c.json({ error: 'Unhandled error' }, 500);
      }
    }
  );
}

export function registerBalanceRouter(app: Hono) {
  app.get('/balance/:address', balanceHandler);
}
