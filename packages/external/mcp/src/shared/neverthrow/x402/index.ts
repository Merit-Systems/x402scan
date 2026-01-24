import {
  err,
  resultFromPromise,
  resultFromThrowable,
} from '@x402scan/neverthrow';
import { createSIWxPayload } from '@x402scan/siwx';

import type { BaseX402Error } from './types';
import type { x402HTTPClient } from '@x402/core/http';
import type { PaymentRequired } from '@x402/core/types';
import type { SIWxExtensionInfo } from '@x402scan/siwx/types';
import type { PrivateKeyAccount } from 'viem';

const errorType = 'x402';

export const x402Err = (cause: string, error: BaseX402Error) =>
  err(errorType, cause, error);

const x402ResultFromPromise = <T>(
  surface: string,
  promise: Promise<T>,
  error: (e: unknown) => BaseX402Error
) => resultFromPromise(errorType, surface, promise, error);

const x402ResultFromThrowable = <T>(
  surface: string,
  fn: () => T,
  error: (e: unknown) => BaseX402Error
) => resultFromThrowable(errorType, surface, fn, error);

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
      cause: 'parse_payment_required',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to parse payment required',
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
      cause: 'create_payment_payload',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create payment payload',
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
      cause: 'get_payment_settlement',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to get payment settlement',
    })
  );
};

export const safeCreateSIWxPayload = (
  surface: string,
  serverInfo: SIWxExtensionInfo,
  signer: PrivateKeyAccount
) => {
  return x402ResultFromPromise(
    surface,
    createSIWxPayload(serverInfo, signer),
    error => ({
      cause: 'create_siwx_payload',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to create SIWX payload',
    })
  );
};
