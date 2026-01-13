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
 * Type definition for x402 payment acceptance options
 */
interface X402Accept {
  maxAmountRequired?: string | number;
  max_amount_required?: string | number;
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
 * this hook intercepts the error, extracts the new price from the 402 response,
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
  const confirmedMaxValueRef = useRef<bigint | null>(null);

  const { onSuccess, onError, onSettled, onMutate, ...restOptions } =
    options ?? {};

  const mutation = useMutation<
    X402FetchResponse<TData>,
    Error,
    bigint | undefined
  >({
    mutationFn: async (overrideMaxValue?: bigint) => {
      const maxValue =
        overrideMaxValue ?? confirmedMaxValueRef.current ?? initialMaxValue;
      const fetchWithPayment = wrapperFn(fetchFn, maxValue);

      try {
        const response = await fetchWithPayment(targetUrl, init);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            errorText || `Failed to fetch: ${response.statusText}`
          );
        }

        // Reset confirmation state on success
        setPriceIncreaseInfo(null);
        confirmedMaxValueRef.current = null;

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
      } catch (error) {
        // Check if this is a price exceeded error from x402-fetch
        if (
          error instanceof Error &&
          (error.message.includes('exceeds maximum') ||
            error.message.includes('Payment amount exceeds') ||
            error.message.includes('max value') ||
            error.message.includes('exceeds the maximum'))
        ) {
          // Extract the actual required price from the 402 response
          const newPrice = await extractNewPriceFromError(
            error,
            targetUrl,
            init
          );

          // Only prompt for confirmation if we successfully extracted a higher price
          if (newPrice && newPrice > maxValue) {
            setPriceIncreaseInfo({
              oldPrice: maxValue,
              newPrice,
            });
            // Throw special error to prevent calling onError callback
            // The component will show a confirmation dialog instead
            throw new Error('PRICE_CONFIRMATION_REQUIRED');
          }
        }
        throw error;
      }
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
      const newPrice = priceIncreaseInfo.newPrice;
      confirmedMaxValueRef.current = newPrice;
      setPriceIncreaseInfo(null);
      mutation.reset();

      // Small delay to ensure state is reset before retry
      setTimeout(() => {
        mutation.mutate(newPrice);
      }, 100);
    }
  }, [priceIncreaseInfo, mutation]);

  /**
   * Cancel the price confirmation and reset to initial state.
   */
  const cancelPriceIncrease = useCallback(() => {
    setPriceIncreaseInfo(null);
    confirmedMaxValueRef.current = null;
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
 * Extracts the actual required price from a 402 Payment Required response.
 *
 * This function attempts to fetch the 402 response to read the payment requirements
 * and extract the maximum amount required. It handles both camelCase and snake_case
 * field names for compatibility with different x402 implementations.
 *
 * @param error - The error thrown by x402-fetch
 * @param targetUrl - The URL that returned 402
 * @param init - Optional fetch request initialization
 * @returns The extracted price as bigint (in token base units), or null if extraction fails
 */
async function extractNewPriceFromError(
  error: Error,
  targetUrl: string,
  init?: RequestInit
): Promise<bigint | null> {
  try {
    // Fetch the 402 response to read payment requirements
    const response = await fetch(targetUrl, init);

    if (response.status === 402) {
      const data = (await response.json()) as X402Response;

      // Extract maxAmountRequired from all accepts entries
      if (data.accepts && Array.isArray(data.accepts)) {
        const amounts: bigint[] = data.accepts
          .map((accept: X402Accept): bigint | null => {
            // Support both camelCase and snake_case
            const amountValue =
              accept.maxAmountRequired ?? accept.max_amount_required;

            if (typeof amountValue === 'string') {
              return BigInt(amountValue);
            } else if (typeof amountValue === 'number') {
              // Convert decimal to base units (assuming 6 decimals for USDC)
              return BigInt(Math.floor(amountValue * 1e6));
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

    // Fallback: attempt to parse amount from error message
    const regex = /(\d+(?:\.\d+)?)/;
    const match = regex.exec(error.message);
    if (match?.[1]) {
      const amount = parseFloat(match[1]);
      return BigInt(Math.floor(amount * 1e6));
    }
  } catch {
    // Silently fail - we'll return null and let the original error propagate
  }

  return null;
}
