import Stripe from 'stripe';

import { headers } from 'next/headers';

import { z } from 'zod';

import { auth } from '@/auth';

import { stripe } from './client';

import { env } from '@/env';

const OnrampSessionResource = Stripe.StripeResource.extend({
  create: Stripe.StripeResource.method({
    method: 'POST',
    path: 'crypto/onramp_sessions',
  }),
});

export const createOnrampSessionSchema = z.object({
  address: z.string(),
  amount: z.number().optional(),
});

export const createOnrampSession = async (
  input: z.infer<typeof createOnrampSessionSchema>
) => {
  const heads = await headers();
  const clientIpAddress =
    env.NEXT_PUBLIC_NODE_ENV === 'development'
      ? undefined
      : (heads.get('x-forwarded-for') ?? undefined);

  // eslint-disable-next-line @typescript-eslint/await-thenable
  const onrampSession = await new OnrampSessionResource(stripe).create({
    source_currency: 'usd',
    destination_network: 'base',
    destination_currency: 'usdc',
    destination_currencies: ['usdc'],
    destination_networks: ['base'],
    wallet_address: input.address,
    lock_wallet_address: true,
    destination_amount: input.amount ? `${input.amount.toFixed(6)}` : undefined,
    customer_ip_address: clientIpAddress,
  });

  return (onrampSession as unknown as { client_secret: string }).client_secret;
};
