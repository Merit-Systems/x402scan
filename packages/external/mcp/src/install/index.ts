import consola from 'consola';
import { printInstallBanner } from './1-print-banner';
import { getClient } from './2-get-client';
import { addServer } from './3-add-server';
import { addFunds } from './4-add-funds';

import type { Command } from '@/types';
import { intro, outro } from '@clack/prompts';

interface InstallFlags {
  client?: string;
  isNew: boolean;
}

export const installMcpServer: Command<InstallFlags> = async (
  wallet,
  flags
) => {
  printInstallBanner(flags.isNew);

  intro('Install MCP server');

  const client = await getClient(flags.client);

  await addServer(client);

  await addFunds({ account: wallet, isNew: flags.isNew, dev: flags.dev });

  console.log();
  consola.success('Your x402scan MCP server is ready to use!');
  console.log();

  outro('Your x402scan MCP server is ready to use!');
};
