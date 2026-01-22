import { resultFromPromise, resultFromThrowable } from '@x402scan/neverthrow';

import type { x402HTTPClient } from '@x402/core/http';
import type { BaseError } from '@x402scan/neverthrow/types';
import type { PaymentRequired } from '@x402/core/types';

type X402ErrorType =
  | 'parse_payment_required'
  | 'create_payment_payload'
  | 'encode_payment_signature_header'
  | 'get_payment_settlement';

type BaseX402Error = BaseError<X402ErrorType>;

const x402ResultFromPromise = <T>(
  surface: string,
  promise: Promise<T>,
  error: (e: unknown) => BaseX402Error
) => resultFromPromise(surface, promise, error);

const x402ResultFromThrowable = <T>(
  surface: string,
  fn: () => T,
  error: (e: unknown) => BaseX402Error
) => resultFromThrowable(surface, fn, error);

export const safeGetPaymentRequired = (
  surface: string,
  client: x402HTTPClient,
  response: Response
) => {
  return x402ResultFromPromise(
    surface,
    response.json().then(
      json =>
        client.getPaymentRequiredResponse(
          name => response.headers.get(name),
          json
        ),
      () =>
        client.getPaymentRequiredResponse(name => response.headers.get(name))
    ),
    error => ({
      type: 'parse_payment_required',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to parse payment required',
      error,
    })
  );
};

export const safeCreatePaymentPayload = (
  surface: string,
  client: x402HTTPClient,
  paymentRequired: PaymentRequired
) => {
  return x402ResultFromPromise(
    surface,
    client.createPaymentPayload(paymentRequired),
    error => ({
      type: 'create_payment_payload',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create payment payload',
      error,
    })
  );
};

export const safeGetPaymentSettlement = (
  surface: string,
  client: x402HTTPClient,
  response: Response
) => {
  return x402ResultFromThrowable(
    surface,
    () => client.getPaymentSettleResponse(name => response.headers.get(name)),
    error => ({
      type: 'get_payment_settlement',
      message: 'Failed to get payment settlement',
      error,
    })
  );
};
