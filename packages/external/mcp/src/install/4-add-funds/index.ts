import { getUSDCBalance } from '@/lib/balance';
import { PrivateKeyAccount } from 'viem';
import consola from 'consola';
import chalk from 'chalk';
import { promptDeposit } from '@/lib/deposit';
import { log as clackLog, spinner } from '@clack/prompts';

interface AddFundsFlags {
  account: PrivateKeyAccount;
  isNew: boolean;
  dev: boolean;
}

export const addFunds = async ({ account, isNew, dev }: AddFundsFlags) => {
  if (isNew) {
    clackLog.info(
      chalk.bold('To call paid API tools, you will need USDC in your wallet.')
    );
    clackLog.message('');

    await promptDeposit(account.address, dev);
  } else {
    const { start, stop } = spinner();
    start('Checking balance...');
    const balance = await getUSDCBalance({ address: account.address });
    await new Promise(resolve => setTimeout(resolve, 1000));
    stop(`Balance: ${balance.formattedString} USDC`);
    if (balance.formatted < 10) {
      consola.info(
        chalk.bold(
          `Your balance is low (${balance.formatted} USDC). Consider topping up.`
        )
      );
      console.log();
      await promptDeposit(account.address, dev);
    }
  }
};
