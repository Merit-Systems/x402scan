import type {
  ExactEvmPayload,
  ExactSvmPayload,
  PaymentPayload,
} from 'x402/types';
import { SupportedEVMNetworks, SupportedSVMNetworks } from 'x402/types';

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
 * Encodes a string to base64 format
 *
 * @param data - The string to be encoded to base64
 * @returns The base64 encoded string
 */
function safeBase64Encode(data: string): string {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.btoa === 'function'
  ) {
    return globalThis.btoa(data);
  }
  return Buffer.from(data).toString('base64');
}
