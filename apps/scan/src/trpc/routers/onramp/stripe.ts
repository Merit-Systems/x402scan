import {
  createOnrampSession,
  createOnrampSessionSchema,
} from '@/services/onramp/stripe/onramp-session';
import { getStripeOnrampQuote } from '@/services/onramp/stripe/quote';
import { getQuoteSchema } from '@/services/onramp/quote';
import { createTRPCRouter, publicProcedure } from '@/trpc/trpc';

export const stripeOnrampRouter = createTRPCRouter({
  getSession: publicProcedure
    .input(createOnrampSessionSchema)
    .query(({ input }) => {
      return createOnrampSession(input);
    }),
  getQuote: publicProcedure.input(getQuoteSchema).query(async ({ input }) => {
    return await getStripeOnrampQuote(input);
  }),
});
