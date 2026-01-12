import { z as z3 } from 'zod3';

export * from './v1';
export * from './v2';
export * from './schema';
export { fetchWithProxy } from './proxy-fetch';

import {
  x402ResponseSchemaV1,
  paymentRequirementsSchemaV1,
  outputSchemaV1,
  type X402ResponseV1,
  type PaymentRequirementsV1,
  type OutputSchemaV1,
} from './v1';
import {
  x402ResponseSchemaV2,
  paymentRequirementsSchemaV2,
  type X402ResponseV2,
  type PaymentRequirementsV2,
} from './v2';
import type { DiscoveryExtension } from '@x402/extensions/bazaar';
import { decodePaymentRequiredHeader } from '@x402/core/http';
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
  const schema = isV2Response(data)
    ? x402ResponseSchemaV2
    : x402ResponseSchemaV1;
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    };
  }
  return { success: true, data: result.data as ParsedX402Response };
}

/**
 * NOTE(shafu): get the output schema from a parsed x402 response
 * V1: outputSchema is in accepts[].outputSchema (bodyFields format)
 * V2: outputSchema comes from extensions.bazaar (info + schema)
 */
export function getOutputSchema(
  response: ParsedX402Response
): OutputSchema | undefined {
  if (!isV2Response(response)) {
    return response.accepts?.[0]?.outputSchema;
  }

  const bazaar = response.extensions?.bazaar as DiscoveryExtension | undefined;
  return bazaar ? getOutputSchemaFromBazaar(bazaar) : undefined;
}

// NOTE(shafu): merge example data from info with field definitions from schema.
function getOutputSchemaFromBazaar(
  bazaar: DiscoveryExtension
): OutputSchema | undefined {
  if (!bazaar.info) {
    return undefined;
  }

  const info = bazaar.info;
  const input = info.input as Record<string, unknown>;
  const body = input.body;

  // Enrich body with schema if info.body has example data (no properties)
  if (
    bazaar.schema &&
    body &&
    typeof body === 'object' &&
    !('properties' in body)
  ) {
    const schema = bazaar.schema as {
      properties?: { input?: { properties?: { body?: unknown } } };
    };
    const bodySchema = schema.properties?.input?.properties?.body;
    if (
      bodySchema &&
      typeof bodySchema === 'object' &&
      'properties' in bodySchema
    ) {
      return {
        input: { ...input, body: bodySchema },
        output: info.output,
      } as unknown as OutputSchema;
    }
  }

  return { input: info.input, output: info.output } as OutputSchema;
}

export function isV2Response(data: unknown): data is X402ResponseV2 {
  return (
    typeof data === 'object' &&
    data !== null &&
    'x402Version' in data &&
    data.x402Version === 2
  );
}

/**
 * NOTE(shafu): get description from a parsed x402 response.
 * V1: description is in accepts[].description
 * V2: description is in resource.description
 */
export function getDescription(
  response: ParsedX402Response
): string | undefined {
  if (isV2Response(response)) {
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
  if (chainId.startsWith('solana:')) {
    const suffix = chainId.split(':')[1];
    return suffix === 'mainnet' ? 'solana' : `solana-${suffix}`;
  }
  return chainId;
}
