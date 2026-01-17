import Stripe from 'stripe';

import z from 'zod';

import { stripe } from './client';
import type { getQuoteSchema } from '../quote';

const OnrampQuoteResource = Stripe.StripeResource.extend({
  create: Stripe.StripeResource.method({
    method: 'GET',
    path: 'crypto/onramp/quotes',
  }),
});

export const getStripeOnrampQuote = async ({
  amount,
}: z.infer<typeof getQuoteSchema>) => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const response = await new OnrampQuoteResource(stripe).create({
    source_amount: amount,
    destination_currencies: ['usdc'],
    destination_networks: ['base'],
    source_currency: 'usd',
  });
  const {
    destination_network_quotes: {
      base_network: [quote],
    },
  } = onrampQuoteSchema.parse(response);

  if (!quote) {
    throw new Error('No quote found');
  }

  return (
    (amount / (amount + Number(quote.fees.transaction_fee_monetary))) *
    Number(quote.destination_amount)
  );
};

const onrampQuoteSchema = z.object({
  destination_network_quotes: z.object({
    base_network: z.array(
      z.object({
        source_total_amount: z.string(),
        destination_amount: z.string(),
        fees: z.object({
          network_fee_monetary: z.string(),
          transaction_fee_monetary: z.string(),
        }),
      })
    ),
  }),
});
