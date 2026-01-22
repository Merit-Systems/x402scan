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

const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6;
const USDC_SYMBOL = 'USDC';
const BASE_CHAIN = base;

async function getBalance(address: Address): Promise<bigint> {
  const rpcUrl = process.env.BASE_RPC_URL;
  if (!rpcUrl) {
    throw new Error('Missing base rpc url');
  }
  const client = createPublicClient({ chain: base, transport: http(rpcUrl) });
  const balance = await client.readContract({
    address: BASE_USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });
  return balance;
}

async function balanceHandler(c: Context) {
  const addressParam = c.req.param('address');
  if (!isAddress(addressParam)) {
    return c.json({ error: 'Invalid EVM address' }, 400);
  }
  const address = getAddress(addressParam);
  const balance = await getBalance(address);
  return c.json({
    chain: BASE_CHAIN.id,
    address,
    balance: formatUnits(balance, USDC_DECIMALS),
    rawBalance: balance.toString(),
    token: {
      symbol: USDC_SYMBOL,
      decimals: USDC_DECIMALS,
      address: BASE_USDC_ADDRESS,
    },
  });
}

export function registerBalanceRouter(app: Hono) {
  app.get('/balance/:address', balanceHandler);
}
