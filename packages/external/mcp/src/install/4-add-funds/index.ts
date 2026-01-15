import chalk from 'chalk';
import { log } from '@clack/prompts';

import { getUSDCBalance } from '@/lib/balance';
import { promptDeposit } from '@/lib/deposit';
import { wait } from '@/lib/wait';

import { PrivateKeyAccount } from 'viem';

interface AddFundsFlags {
  account: PrivateKeyAccount;
  isNew: boolean;
  dev: boolean;
}

export const addFunds = async ({ account, isNew, dev }: AddFundsFlags) => {
  if (isNew || 0 == 0) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    log.info('To use paid API tools, you will need USDC in your wallet.');
    await promptDeposit(account.address, dev);
  } else {
    const balance = await getUSDCBalance({ address: account.address });
    await wait({
      startText: 'Checking balance...',
      stopText: `Balance: ${chalk.bold(`${balance.formattedString} USDC`)} `,
      ms: 1000,
    });
    if (balance.formatted < 10) {
      log.warning(
        chalk.bold(
          `Your balance is low (${balance.formatted} USDC). Consider topping up.`
        )
      );
      await promptDeposit(account.address, dev);
    }
  }
};
