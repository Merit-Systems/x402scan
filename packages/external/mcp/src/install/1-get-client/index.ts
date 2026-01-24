import z from 'zod';

import { select, log, outro } from '@clack/prompts';

import chalk from 'chalk';

import { clientMetadata, Clients } from '../clients';

import type { InstallFlags } from '..';

export const getClient = async ({ client: flagClient, yes }: InstallFlags) => {
  if (yes) {
    if (!flagClient) {
      throw new Error(
        `Client is required when yes is true. Pass --client as one of these values: ${Object.values(Clients).join(', ')}`
      );
    }
    const parsedClient = z.enum(Clients).safeParse(flagClient);
    if (!parsedClient.success) {
      throw new Error(
        `${flagClient} is not a valid client. Valid options are: ${Object.values(Clients).join(', ')}`
      );
    }
    return parsedClient.data;
  }
  const parsedClient = z.enum(Clients).safeParse(flagClient);
  if (parsedClient.success) {
    return parsedClient.data;
  }
  if (flagClient) {
    log.error(`${flagClient} is not a valid client. Please select a client`);
  }
  const client = await select({
    message: 'Where would you like to install the x402scan MCP server?',
    options: Object.values(Clients).map(client => {
      const metadata = clientMetadata[client];
      return {
        label: metadata.name,
        value: client,
      };
    }),
    maxItems: 7,
  });

  const parsedClientSelection = z.enum(Clients).safeParse(client);
  if (parsedClientSelection.success) {
    return parsedClientSelection.data;
  }
  outro(chalk.bold.red('No MCP client selected'));
  process.exit(0);
};
