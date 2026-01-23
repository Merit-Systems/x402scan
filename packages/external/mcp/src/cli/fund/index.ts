import type { Command } from '@/types';
import { intro, log as clackLog, outro } from '@clack/prompts';
import chalk from 'chalk';
import { getWallet } from '@/shared/wallet';
import { promptDeposit } from '@/cli/lib/deposit';
import { log } from '@/shared/log';

export const fundMcpServer: Command = async flags => {
  intro(chalk.bold(`Fund ${chalk.hex('#2563eb')('x402scan MCP')}`));

  const walletResult = await getWallet();

  if (walletResult.isErr()) {
    log.error(walletResult.error.message);
    clackLog.error(walletResult.error.message);
    outro(chalk.bold.red('Failed to get wallet'));
    process.exit(1);
  }

  const {
    account: { address },
  } = walletResult.value;

  await promptDeposit({ address, flags, surface: 'fund' });

  outro(chalk.bold.green('Your x402scan MCP server is funded!'));
};
