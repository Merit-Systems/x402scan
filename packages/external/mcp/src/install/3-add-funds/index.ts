import chalk from 'chalk';
import { log } from '@clack/prompts';

import { getUSDCBalance } from '@/lib/balance';
import { promptDeposit } from '@/lib/deposit';
import { wait } from '@/lib/wait';

import type { Address } from 'viem';
import type { InstallFlags } from '..';

interface AddFundsProps {
  flags: InstallFlags;
  address: Address;
  isNew: boolean;
}

export const addFunds = async ({ flags, address, isNew }: AddFundsProps) => {
  if (isNew) {
    if (!flags.yes) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    log.info('To use paid API tools, you will need USDC in your wallet.');
    await promptDeposit(address, flags);
  } else {
    const balance = await getUSDCBalance({ address });
    if (!flags.yes) {
      await wait({
        startText: 'Checking balance...',
        stopText: `Balance: ${chalk.bold(`${balance} USDC`)} `,
        ms: 1000,
      });
    }
    if (balance < 1) {
      log.warning(
        chalk.bold(
          `Your balance is low (${balance} USDC). Consider topping up.`
        )
      );
      await promptDeposit(address, flags);
    }
  }
};
