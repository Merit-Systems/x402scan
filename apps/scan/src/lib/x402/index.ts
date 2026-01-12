import { z as z3 } from 'zod3';

export * from './v1';
export * from './v2';
export { fetchWithProxy } from './proxy-fetch';

import {
  parseV1,
  paymentRequirementsSchemaV1,
  outputSchemaV1,
  type X402ResponseV1,
  type PaymentRequirementsV1,
  type OutputSchemaV1,
} from './v1';
import {
  parseV2,
  paymentRequirementsSchemaV2,
  type X402ResponseV2,
  type PaymentRequirementsV2,
} from './v2';
import {
  extractDiscoveryInfoFromExtension,
  extractDiscoveryInfoV1,
  type DiscoveryExtension,
  type DiscoveryInfo,
} from '@x402/extensions/bazaar';
import { decodePaymentRequiredHeader } from '@x402/core/http';
// NOTE(shafu): Library type expects CAIP-2 network format (e.g., "eip155:8453"),
// but real v1 payloads use named networks (e.g., "base", "base-sepolia").
// We use this type only for library function calls with a cast.
import type { PaymentRequirementsV1 as LibraryPaymentRequirementsV1 } from '@x402/core/types';
import { ChainIdToNetwork } from 'x402/types';
import type { ParseResult } from './shared';

export type OutputSchema = OutputSchemaV1;
export type InputSchema = OutputSchema['input'];

/**
 * NOTE(shafu): we need this because we want to store the accept in
 * the database in a common format for v1 and v2.
 */
export const normalizedAcceptSchema = z3.object({
  scheme: z3.literal('exact'),
  network: z3.string(),
  maxAmountRequired: z3.string(),
  payTo: z3.string(),
  asset: z3.string(),
  maxTimeoutSeconds: z3.number(),
  extra: z3.record(z3.string(), z3.any()).optional(),
  resource: z3.string().optional(),
  description: z3.string().optional(),
  mimeType: z3.string().optional(),
  outputSchema: outputSchemaV1.optional(),
});

type NormalizedAccept = z3.infer<typeof normalizedAcceptSchema>;

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
 * in the database in a common format, which for legacy reasons is v1.
 */
export function normalizePaymentRequirement(
  accept: PaymentRequirements,
  resource?: X402ResponseV2['resource']
): NormalizedAccept {
  if (isV2PaymentRequirement(accept)) {
    return {
      scheme: accept.scheme as 'exact',
      network: normalizeChainId(accept.network),
      maxAmountRequired: accept.amount,
      payTo: accept.payTo,
      asset: accept.asset,
      maxTimeoutSeconds: accept.maxTimeoutSeconds,
      extra: accept.extra,
      resource: resource?.url,
      description: resource?.description,
      mimeType: resource?.mimeType,
      outputSchema: resource?.outputSchema,
    };
  }
  return {
    scheme: accept.scheme,
    network: accept.network ?? '',
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
 * V1: uses extractDiscoveryInfoV1 from @x402/extensions/bazaar
 * V2: uses extractDiscoveryInfoFromExtension from @x402/extensions/bazaar
 */
export function getOutputSchema(
  response: ParsedX402Response
): OutputSchema | undefined {
  if (response.x402Version !== 2) {
    const firstAccept = response.accepts?.[0];
    if (!firstAccept) return undefined;

    const discoveryInfo = extractDiscoveryInfoV1(
      firstAccept as unknown as LibraryPaymentRequirementsV1
    );
    if (discoveryInfo) {
      return convertDiscoveryInfoToOutputSchema(discoveryInfo);
    }

    return firstAccept.outputSchema;
  }

  const bazaar = response.extensions?.bazaar;
  if (!bazaar) {
    return response.resource?.outputSchema;
  }

  if (bazaar.info && bazaar.schema) {
    try {
      const discoveryInfo = extractDiscoveryInfoFromExtension(
        bazaar as DiscoveryExtension,
        false // skip validation for parsing
      );
      return convertDiscoveryInfoToOutputSchema(discoveryInfo, bazaar.schema);
    } catch {
      // Fall through to legacy handling if extraction fails
    }
  }

  if (bazaar.info) {
    const info = bazaar.info as { input?: unknown; output?: unknown };
    return { input: info.input, output: info.output } as OutputSchema;
  }

  if (bazaar.schema) {
    return { input: bazaar.schema as InputSchema } as OutputSchema;
  }

  return response.resource?.outputSchema;
}

// NOTE(shafu): Converts DiscoveryInfo from x402/extensions/bazaar to our OutputSchema format.
function convertDiscoveryInfoToOutputSchema(
  discoveryInfo: DiscoveryInfo,
  bazaarSchema?: unknown
): OutputSchema {
  const input = discoveryInfo.input as Record<string, unknown>;
  const bodyData = input.body as Record<string, unknown> | undefined;

  // Check if body needs schema enrichment (has example data, not properties)
  const bodyNeedsSchema =
    bodyData && typeof bodyData === 'object' && !('properties' in bodyData);

  if (bodyNeedsSchema && bazaarSchema) {
    interface BazaarSchema {
      properties?: {
        input?: { properties?: { body?: Record<string, unknown> } };
      };
    }
    const schema = bazaarSchema as BazaarSchema;
    const bodySchemaFromExt = schema.properties?.input?.properties?.body;
    if (bodySchemaFromExt && 'properties' in bodySchemaFromExt) {
      return {
        input: { ...input, body: bodySchemaFromExt },
        output: discoveryInfo.output,
      } as unknown as OutputSchema;
    }
  }

  return {
    input: discoveryInfo.input,
    output: discoveryInfo.output,
  } as OutputSchema;
}

export function isV2Response(
  response: ParsedX402Response
): response is X402ResponseV2 {
  return response.x402Version === 2;
}

/**
 * NOTE(shafu): get description from a parsed x402 response.
 * V1: description is in accepts[].description
 * V2: description is in resource.description
 */
export function getDescription(
  response: ParsedX402Response
): string | undefined {
  if (response.x402Version === 2) {
    return response.resource?.description;
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
  return 'amount' in firstAccept
    ? firstAccept.amount
    : firstAccept.maxAmountRequired;
}

export async function extractX402Data(response: Response): Promise<unknown> {
  // v2 - check header first using official @x402/core/http decoder
  const paymentRequiredHeader = response.headers.get('Payment-Required');
  if (paymentRequiredHeader) {
    try {
      return decodePaymentRequiredHeader(paymentRequiredHeader);
    } catch {
      // fall through to body parsing if header decoding fails
    }
  }

  // v1 fallback - response body contains the payment required data
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function normalizeChainId(chainId: string): string {
  if (chainId.startsWith('eip155:')) {
    const id = Number(chainId.split(':')[1]);
    const network = ChainIdToNetwork[id];
    return network ?? chainId;
  }
  return chainId;
}
