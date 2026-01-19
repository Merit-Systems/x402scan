import chalk from 'chalk';
import { log, spinner } from '@clack/prompts';

import { wait } from '@/lib/wait';

import type { Address } from 'viem';
import type { InstallFlags } from '..';

interface RedeemInviteProps {
  flags: InstallFlags;
  address: Address;
}

interface RedeemResponse {
  success: boolean;
  error?: string;
  amount?: string;
  txHash?: string;
}

export const redeemInviteCode = async ({
  flags,
  address,
}: RedeemInviteProps): Promise<boolean> => {
  if (!flags.invite) {
    return false;
  }

  const baseUrl = flags.dev ? 'http://localhost:3000' : 'https://x402scan.com';

  const s = spinner();
  s.start('Redeeming invite code...');

  try {
    const response = await fetch(`${baseUrl}/api/invite/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: flags.invite,
        recipientAddr: address,
      }),
    });

    const data = (await response.json()) as RedeemResponse;

    if (!data.success) {
      s.stop('Invite code redemption failed');
      log.warning(
        chalk.yellow(`Failed to redeem invite code: ${data.error ?? 'Unknown error'}`)
      );
      return false;
    }

    s.stop('Invite code redeemed successfully!');

    await wait({
      startText: 'Processing...',
      stopText: chalk.green(
        `${chalk.bold(data.amount)} USDC has been sent to your wallet!`
      ),
      ms: 1500,
    });

    log.success(
      chalk.bold(`Your wallet has been funded with ${data.amount} USDC`)
    );

    if (data.txHash) {
      log.info(
        chalk.dim(`Transaction: https://basescan.org/tx/${data.txHash}`)
      );
    }

    return true;
  } catch (error) {
    s.stop('Invite code redemption failed');
    log.warning(
      chalk.yellow(
        `Failed to redeem invite code: ${error instanceof Error ? error.message : 'Network error'}`
      )
    );
    return false;
  }
};
