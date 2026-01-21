import { resultFromPromise } from '@x402scan/neverthrow';

import type { x402HTTPClient } from '@x402/core/http';
import type { BaseError } from '@x402scan/neverthrow/types';
import type {
  PaymentPayload,
  PaymentRequired,
  SettleResponse,
} from '@x402/core/types';

type X402ErrorType =
  | 'parse_payment_required'
  | 'create_payment_payload'
  | 'encode_payment_signature_header'
  | 'get_payment_settlement';

type BaseX402Error = BaseError<X402ErrorType>;

const x402ResultFromPromise = <Surface extends string, T>(
  surface: Surface,
  promise: Promise<T>,
  error: (e: unknown) => BaseX402Error
) =>
  resultFromPromise<X402ErrorType, Surface, BaseX402Error, T>(
    surface,
    promise,
    error
  );

export const safeGetPaymentRequired = <Surface extends string>(
  surface: Surface,
  client: x402HTTPClient,
  response: Response
) => {
  return x402ResultFromPromise<Surface, PaymentRequired>(
    surface,
    (async () => {
      return client.getPaymentRequiredResponse(
        name => response.headers.get(name),
        await response.json().catch(() => undefined)
      );
    })(),
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

export const safeCreatePaymentPayload = <Surface extends string>(
  surface: Surface,
  client: x402HTTPClient,
  paymentRequired: PaymentRequired
) => {
  return x402ResultFromPromise<Surface, PaymentPayload>(
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

export const safeGetPaymentSettlement = <Surface extends string>(
  surface: Surface,
  client: x402HTTPClient,
  response: Response
) => {
  return x402ResultFromPromise<Surface, SettleResponse>(
    surface,
    (async () => {
      return Promise.resolve(
        client.getPaymentSettleResponse(name => response.headers.get(name))
      );
    })(),
    error => ({
      type: 'get_payment_settlement',
      message: 'Failed to get payment settlement',
      error,
    })
  );
};
