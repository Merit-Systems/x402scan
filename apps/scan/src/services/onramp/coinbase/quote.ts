import { cdpFetch } from '@/services/cdp/lib/fetch';
import type { getQuoteSchema } from '../quote';
import z from 'zod';
import { OnrampMethods } from '../types';

const amountSchema = z.object({
  value: z.string(),
  currency: z.string(),
});

const coinbaseOnrampQuoteSchema = z.object({
  payment_total: amountSchema,
  payment_subtotal: amountSchema,
  purchase_amount: amountSchema,
  coinbase_fee: amountSchema,
  network_fee: amountSchema,
  quote_id: z.string(),
});

export const getCoinbaseOnrampQuote = async ({
  amount,
  method,
}: z.infer<typeof getQuoteSchema>) => {
  if (!isCoinbaseSupportedMethod(method)) {
    throw new Error('Invalid method');
  }
  const paymentMethod = METHOD_TO_PAYMENT_METHOD[method];
  const { payment_total } = await cdpFetch(
    {
      requestHost: 'api.developer.coinbase.com',
      requestPath: `/onramp/v1/buy/quote`,
      requestMethod: 'POST',
    },
    coinbaseOnrampQuoteSchema,
    {
      body: JSON.stringify({
        purchaseCurrency: 'USDC',
        purchaseNetwork: 'base',
        paymentAmount: amount.toFixed(2),
        paymentMethod,
        paymentCurrency: 'USD',
        country: 'US',
        subdivision: 'NY',
      }),
    }
  );

  return Number(payment_total.value);
};

const METHOD_TO_PAYMENT_METHOD = {
  [OnrampMethods.DEBIT_CARD]: 'CARD',
  [OnrampMethods.ACH]: 'ACH_BANK_ACCOUNT',
} satisfies Partial<Record<OnrampMethods, string>>;

const isCoinbaseSupportedMethod = (
  method: OnrampMethods
): method is OnrampMethods.DEBIT_CARD | OnrampMethods.ACH =>
  method === OnrampMethods.DEBIT_CARD || method === OnrampMethods.ACH;
