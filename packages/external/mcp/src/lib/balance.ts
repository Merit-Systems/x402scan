/**
 * USDC balance reader
 */

import { createPublicClient, http, erc20Abi } from 'viem';

import { getChain, getUSDCAddress, DEFAULT_NETWORK, toCaip2 } from './networks';

import { log } from './log';

import type { Address } from 'viem';
import { tokenBigIntToNumber } from './token';

export async function getBalance(address: Address, network = DEFAULT_NETWORK) {
  const caip2 = toCaip2(network);

  const chain = getChain(caip2);
  if (!chain) throw new Error(`Unsupported network: ${network}`);

  const usdcAddress = getUSDCAddress(caip2);
  if (!usdcAddress) throw new Error(`No USDC address for network: ${network}`);

  log.debug(`Reading USDC balance for ${address} on ${chain.name}`);

  const client = createPublicClient({ chain, transport: http() });
  const balance = await client.readContract({
    address: usdcAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });

  return tokenBigIntToNumber(balance);
}
