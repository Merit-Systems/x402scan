import type { x402HTTPClient } from '@x402/core/client';

import { safeFetch, fetchErr, fetchOk } from '@/shared/neverthrow/fetch';
import {
  safeCreatePaymentPayload,
  safeGetPaymentRequired,
  x402Err,
  x402Ok,
} from '@/shared/neverthrow/x402';

/**
 * Execute a fetch request with automatic x402 payment handling.
 *
 * 1. Makes initial request
 * 2. If 402 response, extracts payment requirements
 * 3. Creates payment payload and signs it
 * 4. Retries request with payment headers
 */
export function createFetchWithPayment(
  surface: string,
  client: x402HTTPClient
) {
  return async (request: Request) => {
    const clonedRequest = request.clone();

    const probeResult = await safeFetch(surface, request);

    if (probeResult.isErr()) {
      return fetchErr(surface, probeResult.error);
    }

    // Not a 402 response - return as-is
    if (probeResult.value.status !== 402) {
      return probeResult.andThen(response =>
        fetchOk({
          response,
          paymentPayload: undefined,
        })
      );
    }

    const response = probeResult.value;

    // Parse payment requirements from 402 response
    const paymentRequiredResult = await safeGetPaymentRequired(
      surface,
      client,
      response
    );

    if (paymentRequiredResult.isErr()) {
      return paymentRequiredResult;
    }

    const paymentRequired = paymentRequiredResult.value;

    // Create and sign payment payload
    const paymentPayloadResult = await safeCreatePaymentPayload(
      surface,
      client,
      paymentRequired
    );

    if (paymentPayloadResult.isErr()) {
      return paymentPayloadResult;
    }

    const paymentPayload = paymentPayloadResult.value;

    // Encode payment header
    const paymentHeaders = client.encodePaymentSignatureHeader(paymentPayload);

    // Check if this is already a retry to prevent infinite loops
    if (
      clonedRequest.headers.has('PAYMENT-SIGNATURE') ||
      clonedRequest.headers.has('X-PAYMENT')
    ) {
      return x402Err(surface, {
        cause: 'payment_already_attempted',
        message: 'Payment already attempted',
      });
    }

    // Add payment headers to cloned request
    for (const [key, value] of Object.entries(paymentHeaders)) {
      clonedRequest.headers.set(key, value);
    }
    clonedRequest.headers.set(
      'Access-Control-Expose-Headers',
      'PAYMENT-RESPONSE,X-PAYMENT-RESPONSE'
    );

    // Retry the request with payment
    return await safeFetch(surface, clonedRequest).andThen(response =>
      x402Ok({
        response,
        paymentPayload,
      })
    );
  };
}
