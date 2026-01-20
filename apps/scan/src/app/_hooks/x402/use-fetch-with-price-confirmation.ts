import { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

import type { UseMutationOptions } from '@tanstack/react-query';
import type { X402FetchResponse, FetchWithPaymentWrapper } from './types';

interface UseX402FetchWithPriceConfirmationParams<TData = unknown> {
  wrapperFn: FetchWithPaymentWrapper;
  targetUrl: string;
  initialMaxValue: bigint;
  init?: RequestInit;
  options?: Omit<UseMutationOptions<X402FetchResponse<TData>>, 'mutationFn'>;
  fetchFn: typeof fetch;
}

interface PriceIncreaseInfo {
  oldPrice: bigint;
  newPrice: bigint;
}

/**
 * Type definition for x402 payment acceptance options (v1 and v2)
 */
interface X402Accept {
  maxAmountRequired?: string | number;
  max_amount_required?: string | number;
  amount?: string | number;
}

/**
 * Type definition for x402 402 response data
 */
interface X402Response {
  accepts?: X402Accept[];
}

/**
 * Hook for handling x402 payments with dynamic price confirmation.
 *
 * When a resource's actual price exceeds the initially estimated price,
 * this hook checks the 402 response first, extracts the actual price,
 * and prompts the user to confirm payment at the higher amount.
 *
 * @example
 * ```tsx
 * const { mutate, priceIncreaseInfo, confirmPriceIncrease, cancelPriceIncrease } =
 *   useX402FetchWithPriceConfirmation({
 *     wrapperFn,
 *     targetUrl: 'https://api.example.com/resource',
 *     initialMaxValue: BigInt(100),
 *     fetchFn: fetch,
 *     options: {
 *       onSuccess: (data) => console.log('Success:', data),
 *     },
 *   });
 * ```
 */

export const useX402FetchWithPriceConfirmation = <TData = unknown>({
  wrapperFn,
  targetUrl,
  initialMaxValue,
  init,
  options,
  fetchFn,
}: UseX402FetchWithPriceConfirmationParams<TData>) => {
  const [priceIncreaseInfo, setPriceIncreaseInfo] =
    useState<PriceIncreaseInfo | null>(null);
  const confirmedRef = useRef<boolean>(false);

  const { onSuccess, onError, onSettled, onMutate, ...restOptions } =
    options ?? {};

  const mutation = useMutation<
    X402FetchResponse<TData>,
    Error,
    boolean | undefined
  >({
    mutationFn: async (skipPriceCheck?: boolean) => {
      // Check price first (unless already confirmed)
      if (!skipPriceCheck && !confirmedRef.current) {
        const actualPrice = await checkPrice(fetchFn, targetUrl, init);

        if (actualPrice && actualPrice > initialMaxValue) {
          setPriceIncreaseInfo({
            oldPrice: initialMaxValue,
            newPrice: actualPrice,
          });
          throw new Error('PRICE_CONFIRMATION_REQUIRED');
        }
      }

      // Make actual payment
      const fetchWithPayment = wrapperFn(fetchFn);

      const response = await fetchWithPayment(targetUrl, init);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to fetch: ${response.statusText}`);
      }

      // Reset confirmation state on success
      setPriceIncreaseInfo(null);
      confirmedRef.current = false;

      const contentType = response.headers.get('content-type') ?? '';
      let result: X402FetchResponse<TData>;
      if (contentType.includes('application/json')) {
        try {
          result = {
            data: (await response.json()) as TData,
            type: 'json' as const,
            paymentResponse: null,
          };
        } catch {
          result = {
            data: await response.text(),
            type: 'unknown' as const,
            paymentResponse: null,
          };
        }
      } else if (contentType.includes('text/')) {
        result = {
          data: await response.text(),
          type: 'text' as const,
          paymentResponse: null,
        };
      } else {
        result = {
          data: await response.text(),
          type: 'unknown' as const,
          paymentResponse: null,
        };
      }

      return result;
    },
    onSuccess: (data, _variables, ...rest) => {
      onSuccess?.(data, undefined, ...rest);
    },
    onError: (error, _variables, ...rest) => {
      // Don't call the original onError for price confirmation required
      if (
        error instanceof Error &&
        error.message === 'PRICE_CONFIRMATION_REQUIRED'
      ) {
        return;
      }
      onError?.(error, undefined, ...rest);
    },
    onSettled: (data, error, _variables, ...rest) => {
      onSettled?.(data, error, undefined, ...rest);
    },
    onMutate: (_variables, ...rest) => {
      return onMutate?.(undefined, ...rest);
    },
    ...restOptions,
  });

  /**
   * Confirm the price increase and retry the payment with the new amount.
   */
  const confirmPriceIncrease = useCallback(() => {
    if (priceIncreaseInfo) {
      confirmedRef.current = true;
      setPriceIncreaseInfo(null);
      mutation.reset();

      // Small delay to ensure state is reset before retry
      setTimeout(() => {
        mutation.mutate(true);
      }, 100);
    }
  }, [priceIncreaseInfo, mutation]);

  /**
   * Cancel the price confirmation and reset to initial state.
   */
  const cancelPriceIncrease = useCallback(() => {
    setPriceIncreaseInfo(null);
    confirmedRef.current = false;
    mutation.reset();
  }, [mutation]);

  return {
    ...mutation,
    priceIncreaseInfo,
    confirmPriceIncrease,
    cancelPriceIncrease,
  };
};

/**
 * Checks the price from a 402 response without making a payment.
 *
 * @param fetchFn - The fetch function to use
 * @param targetUrl - The URL to check
 * @param init - Optional fetch request initialization
 * @returns The price as bigint, or null if extraction fails
 */
async function checkPrice(
  fetchFn: typeof fetch,
  targetUrl: string,
  init?: RequestInit
): Promise<bigint | null> {
  try {
    const response = await fetchFn(targetUrl, init);

    if (response.status === 402) {
      const data = (await response.json()) as X402Response;

      if (data.accepts && Array.isArray(data.accepts)) {
        const amounts: bigint[] = data.accepts
          .map((accept: X402Accept): bigint | null => {
            // Support v1 (maxAmountRequired) and v2 (amount) formats
            const amountValue =
              accept.amount ??
              accept.maxAmountRequired ??
              accept.max_amount_required;

            if (typeof amountValue === 'string') {
              return BigInt(amountValue);
            } else if (typeof amountValue === 'number') {
              return BigInt(Math.floor(amountValue));
            }
            return null;
          })
          .filter((amount): amount is bigint => amount !== null);

        // Return the maximum price among all payment options
        if (amounts.length > 0) {
          return amounts.reduce((max, amount) => (amount > max ? amount : max));
        }
      }
    }
  } catch {
    // Silently fail - we'll return null and proceed with payment
  }

  return null;
}
