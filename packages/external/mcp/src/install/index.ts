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

  console.log('');

  const clients = await getClient(flags.client);

  for (const client of clients) {
    addServer(client);
  }

  console.log('');

  await addFunds({ account: wallet, isNew: flags.isNew, dev: flags.dev });
};
