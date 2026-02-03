import {
  fromNeverthrowError,
  outputAndExit,
  type OutputFlags,
} from '@/cli/output';
import { getWallet } from '@/shared/wallet';

import type { GlobalFlags } from '@/types';
import type { PrivateKeyAccount } from 'viem/accounts';

interface WalletInfo {
  account: PrivateKeyAccount;
}

/**
 * Get wallet or exit with error.
 * This function always returns a valid wallet - if getting the wallet fails,
 * it exits the process with an appropriate error.
 */
export async function getWalletOrExit(
  flags: GlobalFlags<OutputFlags>
): Promise<WalletInfo> {
  const walletResult = await getWallet();

  if (walletResult.isErr()) {
    outputAndExit(fromNeverthrowError(walletResult, 'WALLET_ERROR'), flags);
  }

  return walletResult.value;
}
