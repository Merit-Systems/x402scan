import z from 'zod';

import {
  createOnrampSession,
  createOnrampSessionSchema,
  getStripeOnrampSession,
} from '@/services/onramp/stripe/onramp-session';
import { getStripeOnrampQuote } from '@/services/onramp/stripe/quote';
import { getQuoteSchema } from '@/services/onramp/quote';
import { createTRPCRouter, publicProcedure } from '@/trpc/trpc';

export const stripeOnrampRouter = createTRPCRouter({
  session: {
    get: publicProcedure.input(z.string()).query(async ({ input }) => {
      return await getStripeOnrampSession(input);
    }),

    create: publicProcedure
      .input(createOnrampSessionSchema)
      .query(({ input }) => {
        return createOnrampSession(input);
      }),
  },

  getQuote: publicProcedure.input(getQuoteSchema).query(async ({ input }) => {
    return await getStripeOnrampQuote(input);
  }),
});
