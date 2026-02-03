import { ok } from '@x402scan/neverthrow';
import { x402Client, x402HTTPClient } from '@x402/core/client';

import { safeFetch, safeParseResponse } from '@/shared/neverthrow/fetch';
import { safeGetPaymentRequired } from '@/shared/neverthrow/x402';
import { tokenStringToNumber } from '@/shared/token';
import { getInputSchema } from '@/server/lib/x402-extensions';

import type { JsonObject } from '@/shared/neverthrow/json/types';

/**
 * Payment method info
 */
export interface PaymentMethod {
  price: number;
  network: string;
  asset: string;
}

/**
 * Check endpoint result for non-402 responses
 */
export interface CheckEndpointFreeResult {
  requiresPayment: false;
  statusCode: number;
  data: JsonObject | { text: string } | { type: string };
}

/**
 * Check endpoint result for 402 responses
 */
export interface CheckEndpointPaidResult {
  requiresPayment: true;
  statusCode: number;
  routeDetails: JsonObject;
}

export type CheckEndpointResult =
  | CheckEndpointFreeResult
  | CheckEndpointPaidResult;

/**
 * Check if an endpoint is x402-protected and get pricing/schema info.
 * Does not make any payment.
 */
export async function checkEndpoint(surface: string, request: Request) {
  const responseResult = await safeFetch(surface, request);

  if (responseResult.isErr()) {
    return responseResult;
  }

  const response = responseResult.value;

  // Non-402 error response - return for caller to handle
  if (!response.ok && response.status !== 402) {
    return responseResult;
  }

  // Non-402 success response
  if (response.status !== 402) {
    const parseResponseResult = await safeParseResponse(surface, response);
    if (parseResponseResult.isErr()) {
      return parseResponseResult;
    }

    const data =
      parseResponseResult.value.type === 'json'
        ? parseResponseResult.value.data
        : parseResponseResult.value.type === 'text'
          ? { text: parseResponseResult.value.data }
          : { type: parseResponseResult.value.type };

    return ok<CheckEndpointResult>({
      requiresPayment: false,
      statusCode: response.status,
      data,
    });
  }

  // Parse 402 payment required response
  const client = new x402HTTPClient(new x402Client());

  const paymentRequiredResult = await safeGetPaymentRequired(
    surface,
    client,
    response
  );

  if (paymentRequiredResult.isErr()) {
    return paymentRequiredResult;
  }

  const { resource, extensions, accepts } = paymentRequiredResult.value;

  // Build routeDetails as a clean JsonObject
  const routeDetails: JsonObject = {
    ...resource,
    schema: getInputSchema(extensions) as JsonObject | null,
    paymentMethods: accepts.map(accept => ({
      price: tokenStringToNumber(accept.amount),
      network: accept.network,
      asset: accept.asset,
    })),
  };

  return ok<CheckEndpointResult>({
    requiresPayment: true,
    statusCode: response.status,
    routeDetails,
  });
}
