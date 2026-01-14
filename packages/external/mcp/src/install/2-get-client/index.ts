import z from 'zod';

import { consola } from 'consola';

import { select } from '@inquirer/prompts';

import { Clients } from '../3-add-server/types';

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
  return await select({
    message: 'What client would you like to install?',
    choices: Object.values(Clients).map(client => ({
      name: client,
      value: client,
    })),
  });
};
