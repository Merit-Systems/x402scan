import chalk from 'chalk';
import { log, spinner } from '@clack/prompts';

import { wait } from '@/lib/wait';

import { redeemInviteCode as redeemInviteCodeLib } from '@/lib/redeem-invite';

import type { RedeemInviteProps } from '@/lib/redeem-invite';

export const redeemInviteCode = async (props: RedeemInviteProps) => {
  const s = spinner();
  s.start('Redeeming invite code...');

  const result = await redeemInviteCodeLib(props);

  return result.match(
    async ({ amount, txHash }) => {
      s.stop('Invite code redeemed successfully!');

      await wait({
        startText: 'Processing...',
        stopText: chalk.green(
          `${chalk.bold(amount)} USDC has been sent to your wallet!`
        ),
        ms: 1000,
      });

      log.info(chalk.dim(`Transaction: https://basescan.org/tx/${txHash}`));

      return true;
    },
    error => {
      s.stop('Invite code redemption failed');
      log.warning(
        chalk.yellow(`Failed to redeem invite code: ${error.message}`)
      );
      return false;
    }
  );
};
