import { ok } from '@x402scan/neverthrow';

import { getBalance } from '@/shared/balance';
import { DEFAULT_NETWORK, getChainName } from '@/shared/networks';
import { getDepositLink } from '@/shared/utils';

import type { GlobalFlags } from '@/types';
import type { Address } from 'viem';

/**
 * Wallet info result
 */
export interface WalletInfoResult {
  address: Address;
  network: string;
  networkName: string;
  usdcBalance: number;
  isNewWallet: boolean;
  depositLink: string;
  message?: string;
}

/**
 * Get wallet info including balance and deposit link.
 * Returns the result from getBalance or a WalletInfoResult on success.
 */
export async function getWalletInfo(
  surface: string,
  address: Address,
  flags: GlobalFlags
) {
  const balanceResult = await getBalance({
    address,
    flags,
    surface,
  });

  if (balanceResult.isErr()) {
    return balanceResult;
  }

  const { balance } = balanceResult.value;

  return ok<WalletInfoResult>({
    address,
    network: DEFAULT_NETWORK,
    networkName: getChainName(DEFAULT_NETWORK),
    usdcBalance: balance,
    isNewWallet: balance === 0,
    depositLink: getDepositLink(address, flags),
    ...(balance < 2.5
      ? {
          message: 'Your balance is low. Consider topping it up',
        }
      : {}),
  });
}
