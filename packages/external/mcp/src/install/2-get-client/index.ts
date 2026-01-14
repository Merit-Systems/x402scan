import z from 'zod';

import { consola } from 'consola';

import { checkbox } from '@inquirer/prompts';

import { clientMetadata, Clients } from '../clients';

export const getClient = async (flagClient: string | undefined) => {
  const parsedClient = z.enum(Clients).safeParse(flagClient);
  if (parsedClient.success) {
    return [parsedClient.data];
  }
  if (flagClient) {
    consola.error(
      `${flagClient} is not a valid client. Please select a client`
    );
  }
  const clients = await checkbox({
    message: 'Where would you like to install the x402scan MCP server?',
    choices: Object.values(Clients).map(client => {
      const metadata = clientMetadata[client];
      return {
        name: metadata.name,
        value: client,
      };
    }),
    theme: {},
  });
  if (clients.length === 0) {
    consola.info('No client selected. Exiting...');
    process.exit(1);
  }
  console.log();
  return clients;
};
