import z from 'zod';
import { OnrampMethods, OnrampProviders } from './types';
import { getStripeOnrampQuote } from './stripe/quote';
import { getCoinbaseOnrampQuote } from './coinbase/quote';

export const getQuoteSchema = z.object({
  amount: z.number(),
  method: z.enum(OnrampMethods),
});

type GetQuote = (input: z.infer<typeof getQuoteSchema>) => Promise<number>;

const PROVIDER_QUOTES: Record<OnrampProviders, GetQuote> = {
  [OnrampProviders.STRIPE]: getStripeOnrampQuote,
  [OnrampProviders.COINBASE]: getCoinbaseOnrampQuote,
};

export const getQuotes = async (input: z.infer<typeof getQuoteSchema>) => {
  const quotes = await Promise.all(
    Object.values(OnrampProviders).map(async provider => {
      try {
        const quote = await PROVIDER_QUOTES[provider](input);
        return {
          provider,
          quote,
        };
      } catch (error) {
        console.error(error);
        return null;
      }
    })
  );
  return quotes
    .filter(quote => quote !== null)
    .sort((a, b) => b.quote - a.quote);
};
