import { env } from '@/env';
import {
  MultiNetworkSigner,
  PaymentRequirementsSelector,
  Signer,
  wrapFetchWithPayment as wrapFetchWithPaymentFn,
} from 'x402-fetch';

export const wrapFetchWithPayment = (
  fetch: typeof globalThis.fetch,
  walletClient: Signer | MultiNetworkSigner,
  maxValue?: bigint,
  paymentRequirementsSelector?: PaymentRequirementsSelector
) => {
  return wrapFetchWithPaymentFn(
    fetch,
    walletClient,
    maxValue,
    paymentRequirementsSelector,
    {
      svmConfig: {
        rpcUrl: env.NEXT_PUBLIC_SOLANA_RPC_URL,
      },
    }
  );
};
