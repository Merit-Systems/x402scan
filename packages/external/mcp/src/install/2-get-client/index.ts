import z from 'zod';

import { consola } from 'consola';

import { select } from '@inquirer/prompts';

import { clientMetadata, Clients } from '../clients';

export const getClient = async (flagClient: string | undefined) => {
  const parsedClient = z.enum(Clients).safeParse(flagClient);
  if (parsedClient.success) {
    return parsedClient.data;
  }
  if (flagClient) {
    consola.error(
      `${flagClient} is not a valid client. Please select a client`
    );
  }
  const client = await select({
    message: 'Where would you like to install the x402scan MCP server?',
    choices: Object.values(Clients).map(client => {
      const metadata = clientMetadata[client];
      return {
        name: metadata.name,
        value: client,
      };
    }),
  });
  console.log();
  return client;
};
