import { z } from 'zod';

import { cdpFetch } from '../lib/fetch';
import { ethereumAddressSchema } from '@/lib/schemas';

export const createOnrampUrlParamsSchema = z.object({
  redirect: z.url(),
  amount: z.number(),
  experience: z.enum(['send', 'buy']).default('buy'),
  defaultNetwork: z.literal('base').default('base'),
  defaultAsset: z.literal('USDC').default('USDC'),
  fiatCurrency: z.literal('USD').default('USD'),
  tokenKey: z.string().default('onramp_token'),
});

export const createOnrampUrl = async (
  addressInput: z.input<typeof ethereumAddressSchema>,
  input: z.input<typeof createOnrampUrlParamsSchema>
) => {
  const {
    amount,
    experience,
    defaultNetwork,
    defaultAsset,
    fiatCurrency,
    redirect,
    tokenKey,
  } = createOnrampUrlParamsSchema.parse(input);

  const address = ethereumAddressSchema.parse(addressInput);

  const { token } = await cdpFetch(
    {
      requestHost: 'api.developer.coinbase.com',
      requestPath: `/onramp/v1/token`,
      requestMethod: 'POST',
    },
    z.object({
      token: z.string(),
    }),
    {
      body: JSON.stringify({
        addresses: [
          {
            address,
            blockchains: [defaultNetwork],
          },
        ],
        assets: [defaultAsset],
      }),
    }
  );

  const redirectUrl = new URL(redirect);
  redirectUrl.searchParams.set(tokenKey, token);

  const searchParams = new URLSearchParams({
    sessionToken: token,
    defaultNetwork,
    defaultAsset,
    partnerUserId: token,
    presetCryptoAmount: amount.toString(),
    defaultExperience: experience,
    fiatCurrency,
    redirectUrl: redirectUrl.toString(),
  });

  return {
    url: new URL(
      `https://pay.coinbase.com/buy/select-asset?${searchParams.toString()}`
    ).toString(),
    token,
  };
};
