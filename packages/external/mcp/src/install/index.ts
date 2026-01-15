import { getClient } from './2-get-client';
import { addServer } from './3-add-server';
import { addFunds } from './4-add-funds';

import type { Command } from '@/types';
import { intro, outro } from '@clack/prompts';
import chalk from 'chalk';

interface InstallFlags {
  client?: string;
  isNew: boolean;
}

export const installMcpServer: Command<InstallFlags> = async (
  wallet,
  flags
) => {
  intro(chalk.bold(`Install ${chalk.hex('#2563eb')('x402scan MCP')}`));

  const client = await getClient(flags.client);

  await addServer(client, flags.dev);

  await addFunds({ account: wallet, isNew: flags.isNew, dev: flags.dev });

  outro(chalk.bold.green('Your x402scan MCP server is ready to use!'));
};
