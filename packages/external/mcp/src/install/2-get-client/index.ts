import z from 'zod';

import { select, log } from '@clack/prompts';

import { clientMetadata, Clients } from '../clients';

export const getClient = async (flagClient: string | undefined) => {
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
  });
  return client;
};
