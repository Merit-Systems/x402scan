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
    await new Promise(resolve => setTimeout(resolve, 1000));
    log.info('To use paid API tools, you will need USDC in your wallet.');
    await promptDeposit(address, flags);
  } else {
    const { balanceFormatted } = await getUSDCBalance(address, flags);
    await wait({
      startText: 'Checking balance...',
      stopText: `Balance: ${chalk.bold(`${balanceFormatted} USDC`)} `,
      ms: 1000,
    });
    if (balanceFormatted < 1) {
      log.warning(
        chalk.bold(
          `Your balance is low (${balanceFormatted} USDC). Consider topping up.`
        )
      );
      await promptDeposit(address, flags);
    }
  }
};
