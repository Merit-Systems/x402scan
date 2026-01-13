import { useX402FetchWithPriceConfirmation } from './use-fetch-with-price-confirmation';
import { useEvmPaymentWrapper } from './evm';
import { fetchWithProxy } from '@/lib/x402/proxy-fetch';

import type { UseEvmX402FetchParams } from './types';

/**
 * EVM-specific hook for x402 payments with dynamic price confirmation.
 *
 * Wraps useX402FetchWithPriceConfirmation with EVM wallet integration,
 * handling price increases gracefully by prompting for user confirmation.
 */
export const useEvmX402FetchWithConfirmation = <TData = unknown>({
  chain,
  isTool = false,
  ...params
}: UseEvmX402FetchParams<TData>) => {
  const { wrapperFn } = useEvmPaymentWrapper(chain);

  return useX402FetchWithPriceConfirmation<TData>({
    wrapperFn,
    fetchFn: isTool ? fetch : fetchWithProxy,
    initialMaxValue: params.value,
    ...params,
  });
};
