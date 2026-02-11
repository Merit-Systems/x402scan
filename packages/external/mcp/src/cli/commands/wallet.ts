import {
  successResponse,
  fromNeverthrowError,
  outputAndExit,
  type OutputFlags,
} from '@/cli/output';

import { getWalletInfo } from '@/shared/operations';
import { redeemInviteCode } from '@/shared/redeem-invite';
import { getWalletOrExit } from './lib';

import type { GlobalFlags } from '@/types';

const SURFACE = 'cli:wallet';

export async function walletInfoCommand(
  _args: object,
  flags: GlobalFlags<OutputFlags>
): Promise<void> {
  const { account } = await getWalletOrExit(flags);

  const result = await getWalletInfo(SURFACE, account.address, flags);

  if (result.isErr()) {
    return outputAndExit(fromNeverthrowError(result), flags);
  }

  return outputAndExit(
    successResponse({
      address: result.value.address,
      network: result.value.network,
      networkName: result.value.networkName,
      usdcBalance: result.value.usdcBalance,
      isNewWallet: result.value.isNewWallet,
      depositLink: result.value.depositLink,
      ...(result.value.message ? { message: result.value.message } : {}),
    }),
    flags
  );
}

interface WalletRedeemArgs {
  code: string;
}

export async function walletRedeemCommand(
  args: WalletRedeemArgs,
  flags: GlobalFlags<OutputFlags>
): Promise<void> {
  const { account } = await getWalletOrExit(flags);

  const result = await redeemInviteCode({
    code: args.code,
    dev: flags.dev,
    address: account.address,
    surface: SURFACE,
  });

  if (result.isErr()) {
    return outputAndExit(fromNeverthrowError(result), flags);
  }

  return outputAndExit(
    successResponse({
      redeemed: true,
      amount: `${result.value.amount} USDC`,
      txHash: result.value.txHash,
    }),
    flags
  );
}
