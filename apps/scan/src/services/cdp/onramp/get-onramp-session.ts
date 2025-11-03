import { ethereumAddressSchema, ethereumHashSchema } from '@/lib/schemas';
import { cdpFetch } from '../lib/fetch';

import { z } from 'zod';

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
  payment_total: amountSchema,
  payment_subtotal: amountSchema,
  payment_total_usd: amountSchema,
  coinbase_fee: amountSchema,
  network_fee: amountSchema,
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
  ]),
  tx_hash: ethereumHashSchema.nullable().optional(),
  transaction_id: z.string().nullable().optional(),
  wallet_address: ethereumAddressSchema,
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
