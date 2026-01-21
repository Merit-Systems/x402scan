import type { Command } from '@/types';
import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';
import { getWallet } from '@/lib/wallet';
import { promptDeposit } from '@/lib/deposit';

export const fundMcpServer: Command = async flags => {
  intro(chalk.bold(`Fund ${chalk.hex('#2563eb')('x402scan MCP')}`));

  const {
    account: { address },
  } = await getWallet();

  await promptDeposit(address, flags);

  outro(chalk.bold.green('Your x402scan MCP server is funded!'));
};
