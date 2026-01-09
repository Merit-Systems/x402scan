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
    // V2: amount field, chain ID format, resource at top level
    return {
      scheme: accept.scheme,
      // NOTE(shafu): we save the network name!
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
  // V1: maxAmountRequired field, named network, per-accept resource info
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
 * V1: schema is in accepts[0].outputSchema
 * V2: schema is in extensions.bazaar.schema or extensions.bazaar.info
 */
export function getOutputSchema(
  response: ParsedX402Response
): OutputSchema | undefined {
  if (response.x402Version === 2) {
    const bazaar = response.extensions?.bazaar;
    if (bazaar?.info) {
      const info = bazaar.info as OutputSchema;
      const input = info.input;

      // If input.body exists but is empty, try to get schema from bazaar.schema
      if (
        input &&
        'body' in input &&
        input.body &&
        typeof input.body === 'object' &&
        Object.keys(input.body).length === 0 &&
        bazaar.schema
      ) {
        // Extract body schema from bazaar.schema.properties.input.properties.body
        const schemaObj = bazaar.schema as Record<string, unknown>;
        const schemaProps = schemaObj.properties as
          | Record<string, unknown>
          | undefined;
        const inputSchema = schemaProps?.input as
          | Record<string, unknown>
          | undefined;
        const inputProps = inputSchema?.properties as
          | Record<string, unknown>
          | undefined;
        const bodySchema = inputProps?.body as
          | Record<string, unknown>
          | undefined;

        if (bodySchema && 'properties' in bodySchema) {
          // Merge the body schema into input
          return {
            ...info,
            input: {
              ...input,
              body: bodySchema,
            },
          } as OutputSchema;
        }
      }

      return info;
    }
    if (bazaar?.schema) {
      // NOTE(shafu): bazaar.schema is a raw JSON Schema - wrap it as input schema
      return { input: bazaar.schema as InputSchema } as OutputSchema;
    }
    return response.resource?.outputSchema;
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
  // v2 - check header first
  const paymentRequiredHeader = response.headers.get('Payment-Required');
  if (paymentRequiredHeader) {
    try {
      const decoded = Buffer.from(paymentRequiredHeader, 'base64').toString(
        'utf-8'
      );
      return JSON.parse(decoded);
    } catch {
      // fall through to body parsing if header decoding fails
    }
  }

  // v1 fallback
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
