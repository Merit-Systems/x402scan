import chalk from 'chalk';
import { log, spinner } from '@clack/prompts';

import { wait } from '@/lib/wait';

import { redeemInviteCode as redeemInviteCodeLib } from '@/lib/redeem-invite';

import type { RedeemInviteProps } from '@/lib/redeem-invite';
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
    async ({ data }) => {
      if (!flags.yes) {
        s.stop('Invite code redeemed successfully!');

        await wait({
          startText: 'Processing...',
          stopText: chalk.green(
            `${chalk.bold(data.amount)} USDC has been sent to your wallet!`
          ),
          ms: 1000,
        });
      } else {
        log.success(
          chalk.green(
            `${chalk.bold(data.amount)} USDC has been sent to your wallet!`
          )
        );
      }

      log.info(
        chalk.dim(`Transaction: https://basescan.org/tx/${data.txHash}`)
      );

      return true;
    },
    error => {
      s.stop('Invite code redemption failed');
      log.warning(
        chalk.yellow(`Failed to redeem invite code: ${error?.message}`)
      );
      return false;
    }
  );
};
