import { z } from 'zod';

import { cdpFetch } from '@/services/cdp/lib/fetch';

export const createOnrampUrlParamsSchema = z.object({
  redirect: z.url(),
  amount: z.number(),
  experience: z.enum(['send', 'buy']).default('buy'),
  defaultAsset: z.literal('USDC').default('USDC'),
  fiatCurrency: z.literal('USD').default('USD'),
  tokenKey: z.string().default('onramp_token'),
  redirectSearchParams: z.record(z.string(), z.string()).optional(),
});

export const createOnrampUrl = async (
  address: string,
  input: z.input<typeof createOnrampUrlParamsSchema>
) => {
  const {
    amount,
    experience,
    defaultAsset,
    fiatCurrency,
    redirect,
    tokenKey,
    redirectSearchParams,
  } = createOnrampUrlParamsSchema.parse(input);

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
            blockchains: ['base'],
          },
        ],
        assets: [defaultAsset],
      }),
    }
  );

  const redirectUrl = new URL(redirect);
  redirectUrl.searchParams.set(tokenKey, token);
  redirectUrl.searchParams.set('network', 'base');

  if (redirectSearchParams) {
    Object.entries(redirectSearchParams).forEach(([key, value]) => {
      redirectUrl.searchParams.set(key, value);
    });
  }

  const searchParams = new URLSearchParams({
    sessionToken: token,
    defaultNetwork: 'base',
    defaultAsset,
    partnerUserId: token,
    presetFiatAmount: amount.toString(),
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

const amountSchema = z.object({
  value: z.string(),
  currency: z.string(),
});

const onrampTransactionSchema = z.object({
  status: z.enum([
    'ONRAMP_TRANSACTION_STATUS_IN_PROGRESS',
    'ONRAMP_TRANSACTION_STATUS_SUCCESS',
    'ONRAMP_TRANSACTION_STATUS_FAILED',
  ]),
  purchase_currency: z.string(),
  purchase_network: z.string(),
  purchase_amount: amountSchema,
  payment_total: amountSchema.nullable(),
  payment_subtotal: amountSchema.nullable(),
  payment_total_usd: amountSchema.nullable(),
  coinbase_fee: amountSchema.nullable(),
  network_fee: amountSchema.nullable(),
  exchange_rate: amountSchema,
  country: z.string(),
  user_id: z.string(),
  user_type: z.string(),
  payment_method: z.enum([
    'CARD',
    'ACH_BANK_ACCOUNT',
    'APPLE_PAY',
    'FIAT_WALLET',
    'CRYPTO_WALLET',
    'UNSPECIFIED',
  ]),
  tx_hash: z.string().nullable().optional(),
  transaction_id: z.string().nullable().optional(),
  wallet_address: z.string(),
  contract_address: z.string().nullable().optional(),
  type: z.enum([
    'ONRAMP_TRANSACTION_TYPE_BUY_AND_SEND',
    'ONRAMP_TRANSACTION_TYPE_SEND',
  ]),
  created_at: z.coerce.date(),
  completed_at: z.coerce.date(),
  failure_reason: z.string(),
  end_partner_name: z.string(),
  partner_user_ref: z.string(),
});

export const getOnrampTransactions = async (partnerUserRef: string) => {
  return cdpFetch(
    {
      requestPath: `/onramp/v1/buy/user/${partnerUserRef}/transactions`,
      requestMethod: 'GET',
      requestHost: 'api.developer.coinbase.com',
    },
    z.object({
      transactions: z.array(onrampTransactionSchema),
      next_page_key: z.string().optional(),
      total_count: z.coerce.number(),
    })
  );
};
