import { getUSDCBalance } from '@/lib/balance';
import { PrivateKeyAccount } from 'viem';
import chalk from 'chalk';
import { promptDeposit } from '@/lib/deposit';
import { log as clackLog, log } from '@clack/prompts';
import { wait } from '@/lib/wait';

interface AddFundsFlags {
  account: PrivateKeyAccount;
  isNew: boolean;
  dev: boolean;
}

export const addFunds = async ({ account, isNew, dev }: AddFundsFlags) => {
  if (isNew || 0 == 0) {
    clackLog.info(
      chalk.bold('To call paid API tools, you will need USDC in your wallet.')
    );
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
