import z from 'zod';

import { createTRPCRouter, publicProcedure } from '@/trpc/trpc';

import {
  createOnrampUrl,
  createOnrampUrlParamsSchema,
  getOnrampTransactions,
} from '@/services/onramp/coinbase/onramp-session';

import { ethereumAddressSchema } from '@/lib/schemas';

export const coinbaseOnrampRouter = createTRPCRouter({
  session: {
    get: publicProcedure.input(z.string()).query(async ({ input }) => {
      const { transactions } = await getOnrampTransactions(input);

      return transactions[0];
    }),

    create: publicProcedure
      .input(
        createOnrampUrlParamsSchema.extend({
          address: ethereumAddressSchema,
        })
      )
      .mutation(async ({ input }) => {
        const { url } = await createOnrampUrl(input.address, input);
        return url;
      }),
  },
});
