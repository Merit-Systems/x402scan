/**
 * USDC balance reader
 */

import { createPublicClient, http, erc20Abi } from 'viem';

import { getChain, getUSDCAddress, DEFAULT_NETWORK, toCaip2 } from './networks';

import { log } from './log';

import type { Address } from 'viem';
import { tokenBigIntToNumber } from './token';
import { err, ok, resultFromPromise } from '@x402scan/neverthrow';

const balanceSurface = 'balance';

export async function getBalance(address: Address, network = DEFAULT_NETWORK) {
  const caip2 = toCaip2(network);

  const chain = getChain(caip2);

  if (!chain) {
    return err('input', balanceSurface, {
      cause: 'unsupported_network',
      message: `Unsupported network: ${network}`,
    });
  }

  const usdcAddress = getUSDCAddress(caip2);

  if (!usdcAddress) {
    return err('input', balanceSurface, {
      cause: 'no_usdc_address',
      message: `No USDC address for network: ${network}`,
    });
  }

  log.debug(`Reading USDC balance for ${address} on ${chain.name}`);

  const client = createPublicClient({ chain, transport: http() });

  const balanceResult = await resultFromPromise(
    'rpc',
    balanceSurface,
    client.readContract({
      address: usdcAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address],
    }),
    () => ({
      cause: 'internal',
      message: 'Failed to get USDC balance',
    })
  );

  if (balanceResult.isErr()) {
    return balanceResult;
  }

  return ok(tokenBigIntToNumber(balanceResult.value));
}
