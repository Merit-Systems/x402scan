import type {
  ExactEvmPayload,
  ExactSvmPayload,
  PaymentPayload,
} from 'x402/types';
import {
  PaymentPayloadSchema,
  SupportedEVMNetworks,
  SupportedSVMNetworks,
} from 'x402/types';

/**
 * Encodes a payment payload into a base64 string, ensuring bigint values are properly stringified
 *
 * @param payment - The payment payload to encode
 * @returns A base64 encoded string representation of the payment payload
 */
export function encodePayment(payment: PaymentPayload): string {
  let safe: PaymentPayload;

  // evm
  if (SupportedEVMNetworks.includes(payment.network)) {
    const evmPayload = payment.payload as ExactEvmPayload;
    safe = {
      ...payment,
      payload: {
        ...evmPayload,
        authorization: Object.fromEntries(
          Object.entries(evmPayload.authorization).map(([key, value]) => [
            key,
            typeof value === 'bigint' ? (value as bigint).toString() : value,
          ])
        ) as ExactEvmPayload['authorization'],
      },
    };
    return safeBase64Encode(JSON.stringify(safe));
  }

  // svm
  if (SupportedSVMNetworks.includes(payment.network)) {
    safe = { ...payment, payload: payment.payload as ExactSvmPayload };
    return safeBase64Encode(JSON.stringify(safe));
  }

  throw new Error('Invalid network');
}

/**
 * Decodes a base64 encoded payment string back into a PaymentPayload object
 *
 * @param payment - The base64 encoded payment string to decode
 * @returns The decoded and validated PaymentPayload object
 */
export function decodePayment(payment: string): PaymentPayload {
  const decoded = safeBase64Decode(payment);
  const parsed = JSON.parse(decoded) as PaymentPayload;

  let obj: PaymentPayload;

  // evm
  if (SupportedEVMNetworks.includes(parsed.network)) {
    obj = {
      ...parsed,
      payload: parsed.payload as ExactEvmPayload,
    };
  }

  // svm
  else if (SupportedSVMNetworks.includes(parsed.network)) {
    obj = {
      ...parsed,
      payload: parsed.payload as ExactSvmPayload,
    };
  } else {
    throw new Error('Invalid network');
  }

  const validated = PaymentPayloadSchema.parse(obj);
  return validated;
}

export const Base64EncodedRegex = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Encodes a string to base64 format
 *
 * @param data - The string to be encoded to base64
 * @returns The base64 encoded string
 */
export function safeBase64Encode(data: string): string {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.btoa === 'function'
  ) {
    return globalThis.btoa(data);
  }
  return Buffer.from(data).toString('base64');
}

/**
 * Decodes a base64 string back to its original format
 *
 * @param data - The base64 encoded string to be decoded
 * @returns The decoded string in UTF-8 format
 */
export function safeBase64Decode(data: string): string {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.atob === 'function'
  ) {
    return globalThis.atob(data);
  }
  return Buffer.from(data, 'base64').toString('utf-8');
}
