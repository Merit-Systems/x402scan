import open from 'open';
import consola from 'consola';

import { getUSDCBalance } from '@/lib/balance';

import { addServer } from './install';
import { printBanner } from '@/lib/banner';

import { select } from '@inquirer/prompts';
import { Clients } from './clients/types';

import type { Command } from '@/types';
import z from 'zod';

interface InstallFlags {
  client?: string;
  isNew: boolean;
}

export const installMcpServer: Command<InstallFlags> = async (
  wallet,
  flags
) => {
  const { isNew, client: flagClient, dev } = flags;

  printBanner(
    flags.isNew
      ? {
          heading: `Welcome to the x402scan MCP server!`,
          description:
            'A tool for calling x402-protected APIs with automatic payment handling.',
        }
      : {
          heading: `Welcome back to the x402scan MCP server!`,
          description:
            'A tool for calling x402-protected APIs with automatic payment handling.',
        }
  );

  const client = await getClient(flagClient);

  addServer(client);

  const baseUrl = dev ? 'http://localhost:3000' : 'https://x402scan.com';

  if (isNew) {
    console.log(
      'To use the MCP server, you will need USDC in your wallet to make paid API calls.'
    );
    // this should be confirmed by the user
    await open(`${baseUrl}/deposit/${wallet.address}`);
  } else {
    const balance = await getUSDCBalance({ address: wallet.address });
    if (balance.formatted < 0.5) {
      console.log('Your balance is low. Consider topping up.');
      // this should be confirmed by the user
      await open(`${baseUrl}/deposit/${wallet.address}`);
    }
  }
};

const getClient = async (flagClient: string | undefined) => {
  const parsedClient = z.enum(Clients).safeParse(flagClient);
  if (parsedClient.success) {
    return parsedClient.data;
  }
  if (flagClient) {
    consola.error(
      `${flagClient} is not a valid client. Please select a client`
    );
  }
  return await select({
    message: 'What client would you like to install?',
    choices: Object.values(Clients).map(client => ({
      name: client,
      value: client,
    })),
  });
};
