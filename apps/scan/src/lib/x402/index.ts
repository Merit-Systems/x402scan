import { z as z3 } from 'zod3';

export * from './v1';
export * from './v2';
export { fetchWithProxy } from './proxy-fetch';

import {
  parseV1,
  paymentRequirementsSchemaV1,
  type X402ResponseV1,
  type PaymentRequirementsV1,
  type OutputSchemaV1,
} from './v1';
import {
  parseV2,
  paymentRequirementsSchemaV2,
  type X402ResponseV2,
  type PaymentRequirementsV2,
  type OutputSchemaV2,
} from './v2';

export type OutputSchema = OutputSchemaV1 | OutputSchemaV2;
import { normalizeChainId } from './v2/normalize';

export const paymentRequirementsSchema = z3.union([
  paymentRequirementsSchemaV1,
  paymentRequirementsSchemaV2,
]);

export type PaymentRequirements = PaymentRequirementsV1 | PaymentRequirementsV2;

function isV2PaymentRequirement(
  accept: PaymentRequirements
): accept is PaymentRequirementsV2 {
  return 'amount' in accept;
}

/**
 * NOTE(shafu): we do this because we want to store the payment requirements 
 * in the database in a common format.
 * maps v2's 'amount' to 'maxAmountRequired' and normalizes chain IDs.
 * NOT GREAT
 */
export function normalizePaymentRequirement(
  accept: PaymentRequirements,
  resourceInfo?: X402ResponseV2['resourceInfo']
): {
  scheme: 'exact';
  network?: string;
  maxAmountRequired: string;
  payTo: string;
  asset: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
  // these come from accept in v1, from resourceInfo in v2
  resource?: string;
  description?: string;
  mimeType?: string;
  outputSchema?: OutputSchemaV1 | OutputSchemaV2;
} {
  if (isV2PaymentRequirement(accept)) {
    // V2: amount field, chain ID format, resourceInfo at top level
    return {
      scheme: accept.scheme,
      network: normalizeChainId(accept.network),
      maxAmountRequired: accept.amount,
      payTo: accept.payTo,
      asset: accept.asset,
      maxTimeoutSeconds: accept.maxTimeoutSeconds,
      extra: accept.extra,
      // V2 resourceInfo fields
      resource: resourceInfo?.resource,
      description: resourceInfo?.description,
      mimeType: resourceInfo?.mimeType,
      outputSchema: resourceInfo?.outputSchema,
    };
  }
  // V1: maxAmountRequired field, named network, per-accept resourceInfo
  return {
    scheme: accept.scheme,
    network: accept.network,
    maxAmountRequired: accept.maxAmountRequired,
    payTo: accept.payTo,
    asset: accept.asset,
    maxTimeoutSeconds: accept.maxTimeoutSeconds,
    extra: accept.extra,
    resource: accept.resource,
    description: accept.description,
    mimeType: accept.mimeType,
    outputSchema: accept.outputSchema,
  };
}

export type ParsedX402Response = X402ResponseV1 | X402ResponseV2;

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export function parseX402Response(
  data: unknown
): ParseResult<ParsedX402Response> {
  const version = detectVersion(data);
  if (version === 2) {
    return parseV2(data);
  }
  return parseV1(data);
}

function detectVersion(data: unknown): 1 | 2 {
  if (typeof data === 'object' && data !== null && 'x402Version' in data) {
    return (data as { x402Version: number }).x402Version === 2 ? 2 : 1;
  }
  return 1;
}

/**
 * NOTE(shafu): get the output schema from a parsed x402 response
 * V1: schema is in accepts[0].outputSchema
 * V2: schema is in resourceInfo.outputSchema
 */
export function getOutputSchema(response: ParsedX402Response) {
  if (response.x402Version === 2) {
    return response.resourceInfo?.outputSchema;
  }
  return response.accepts?.[0]?.outputSchema;
}

export function isV2Response(
  response: ParsedX402Response
): response is X402ResponseV2 {
  return response.x402Version === 2;
}

/**
 * NOTE(shafu): get description from a parsed x402 response.
 * V1: description is in accepts[].description
 * V2: description is in resourceInfo.description
 */
export function getDescription(response: ParsedX402Response): string | undefined {
  if (response.x402Version === 2) {
    return response.resourceInfo?.description;
  }
  return response.accepts?.find(a => a.description)?.description;
}

/**
 * NOTE(shafu): get the max amount required from a payment requirement (normalized to string).
 * V1: uses maxAmountRequired
 * V2: uses amount
 */
export function getMaxAmount(response: ParsedX402Response): string | undefined {
  const firstAccept = response.accepts?.[0];
  if (!firstAccept) return undefined;
  return 'amount' in firstAccept ? firstAccept.amount : firstAccept.maxAmountRequired;
}
