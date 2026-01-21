import chalk from 'chalk';
import { log, spinner } from '@clack/prompts';

import { getBalance } from '@/shared/balance';
import { promptDeposit } from '@/cli/lib/deposit';

import type { Address } from 'viem';
import type { InstallFlags } from '..';

interface AddFundsProps {
  flags: InstallFlags;
  address: Address;
  isNew: boolean;
}

export const addFunds = async ({ flags, address, isNew }: AddFundsProps) => {
  if (isNew) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    log.info('To use paid API tools, you will need USDC in your wallet.');
    await promptDeposit(address, flags);
  } else {
    const { start, stop } = spinner();

    start('Checking balance...');
    const balanceResult = await getBalance(address);

    if (balanceResult.isOk()) {
      stop(`Balance: ${chalk.bold(`${balanceResult.value} USDC`)} `);
    } else {
      stop(`Error: ${balanceResult.error.message}`);
      return;
    }

    const balance = balanceResult.value;
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
