import consola from 'consola';
import { printInstallBanner } from './1-print-banner';
import { getClient } from './2-get-client';
import { addServer } from './3-add-server';
import { addFunds } from './4-add-funds';

import type { Command } from '@/types';

interface InstallFlags {
  client?: string;
  isNew: boolean;
}

export const installMcpServer: Command<InstallFlags> = async (
  wallet,
  flags
) => {
  printInstallBanner(flags.isNew);

  const client = await getClient(flags.client);

  addServer(client);

  await addFunds({ account: wallet, isNew: flags.isNew, dev: flags.dev });

  console.log();
  consola.success('Your x402scan MCP server is ready to use!');
  console.log();
};
