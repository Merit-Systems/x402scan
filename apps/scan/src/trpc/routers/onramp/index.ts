import { createTRPCRouter, publicProcedure } from '@/trpc/trpc';
import { stripeOnrampRouter } from './stripe';
import { getQuotes, getQuoteSchema } from '@/services/onramp/quote';
import { coinbaseOnrampRouter } from './coinbase';

export const onrampRouter = createTRPCRouter({
  stripe: stripeOnrampRouter,
  coinbase: coinbaseOnrampRouter,

  quotes: publicProcedure.input(getQuoteSchema).query(async ({ input }) => {
    return await getQuotes(input);
  }),
});
