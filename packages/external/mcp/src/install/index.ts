import { printInstallBanner } from './1-print-banner';
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
  printInstallBanner(flags.isNew);

  intro(chalk.bold('Install MCP server'));

  const client = await getClient(flags.client);

  await addServer(client);

  await addFunds({ account: wallet, isNew: flags.isNew, dev: flags.dev });

  outro(chalk.bold.green('Your x402scan MCP server is ready to use!'));
};
