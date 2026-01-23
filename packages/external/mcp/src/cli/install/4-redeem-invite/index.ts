import chalk from 'chalk';
import { log, spinner } from '@clack/prompts';

import { wait } from '@/cli/lib/wait';

import { redeemInviteCode as redeemInviteCodeLib } from '@/shared/redeem-invite';

import type { RedeemInviteProps } from '@/shared/redeem-invite';
import type { GlobalFlags } from '@/types';

export const redeemInviteCode = async (
  props: RedeemInviteProps,
  flags: GlobalFlags
) => {
  const s = spinner();

  if (!flags.yes) {
    s.start('Redeeming invite code...');
  }

  const result = await redeemInviteCodeLib(props);

  return result.match(
    async ({ amount, txHash }) => {
      if (!flags.yes) {
        s.stop('Invite code redeemed successfully!');

        await wait({
          startText: 'Processing...',
          stopText: chalk.green(
            `${chalk.bold(amount)} USDC has been sent to your wallet!`
          ),
          ms: 1000,
        });
      }

      log.info(chalk.dim(`Transaction: https://basescan.org/tx/${txHash}`));

      return true;
    },
    error => {
      if (!flags.yes) {
        s.stop('Invite code redemption failed');
      }
      log.warning(
        chalk.yellow(`Failed to redeem invite code: ${error.message}`)
      );
      return false;
    }
  );
};
