import type { Command } from '@/types';
import { intro, log, outro } from '@clack/prompts';
import chalk from 'chalk';
import { getWallet } from '@/lib/wallet';
import { promptDeposit } from '@/lib/deposit';

export const fundMcpServer: Command = async flags => {
  intro(chalk.bold(`Fund ${chalk.hex('#2563eb')('x402scan MCP')}`));

  const walletResult = await getWallet();

  if (walletResult.isErr()) {
    log.error(JSON.stringify(walletResult.error, null, 2));
    outro(chalk.bold.red('Failed to get wallet'));
    process.exit(1);
  }

  const {
    account: { address },
  } = walletResult.value;

  await promptDeposit(address, flags);

  outro(chalk.bold.green('Your x402scan MCP server is funded!'));
};
