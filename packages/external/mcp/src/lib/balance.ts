/**
 * USDC balance reader
 */

import { createPublicClient, http, erc20Abi, formatUnits } from 'viem';

import { getChain, getUSDCAddress, DEFAULT_NETWORK, toCaip2 } from './networks';

import { log } from './log';

import type { Address } from 'viem';

interface GetUSDCBalanceProps {
  address: Address;
  network?: string;
}

export async function getUSDCBalance({
  address,
  network = DEFAULT_NETWORK,
}: GetUSDCBalanceProps) {
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

  return parseFloat(formatUnits(balance, 6));
}
