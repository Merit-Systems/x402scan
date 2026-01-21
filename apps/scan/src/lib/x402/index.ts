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

type PaymentRequirements = PaymentRequirementsV1 | PaymentRequirementsV2;

function isV2Accept(
  accept: PaymentRequirements
): accept is PaymentRequirementsV2 {
  return 'amount' in accept;
}

// NOTE(shafu): normalize v2 and v1 to a common accept format
function normalizeAccept(
  accept: PaymentRequirements,
  resource?: X402ResponseV2['resource'],
  outputSchema?: OutputSchemaV1
): NormalizedAccept {
  const common = {
    payTo: accept.payTo,
    asset: accept.asset,
    maxTimeoutSeconds: accept.maxTimeoutSeconds,
    extra: accept.extra,
  };
  if (isV2Accept(accept)) {
    return {
      ...common,
      scheme: accept.scheme as 'exact',
      network: normalizeChainId(accept.network),
      maxAmountRequired: accept.amount,
      resource: resource?.url,
      description: resource?.description,
      mimeType: resource?.mimeType,
      outputSchema,
    };
  }
  return {
    ...common,
    scheme: accept.scheme,
    network: accept.network ?? '',
    maxAmountRequired: accept.maxAmountRequired,
    resource: accept.resource,
    description: accept.description,
    mimeType: accept.mimeType,
    outputSchema: accept.outputSchema,
  };
}

export type ParsedX402Response = X402ResponseV1 | X402ResponseV2;

export function normalizeAccepts(
  response: ParsedX402Response
): NormalizedAccept[] {
  const isV2 = isV2Response(response);
  const resource = isV2 ? response.resource : undefined;
  const outputSchema = isV2 ? getOutputSchema(response) : undefined;

  return (
    response.accepts?.map(accept =>
      normalizeAccept(accept, resource, outputSchema)
    ) ?? []
  );
}

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
      errors: [
        'x402scan parseX402Response() error',
        ...result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
      ],
    };
  }

  return { success: true, data: result.data as ParsedX402Response };
}

// NOTE(shafu): get output schema for v1 and v2
export function getOutputSchema(
  response: ParsedX402Response
): OutputSchema | undefined {
  if (!isV2Response(response)) {
    return response.accepts?.[0]?.outputSchema;
  }

  const bazaar = response.extensions?.bazaar;
  if (!bazaar) return undefined;
  return getOutputSchemaFromBazaar(bazaar as DiscoveryExtension);
}

function getOutputSchemaFromBazaar(
  bazaar: DiscoveryExtension
): OutputSchema | undefined {
  if (!bazaar.info) {
    return undefined;
  }

  const info = bazaar.info;
  const input = info.input as Record<string, unknown>;
  const body = input.body;
  const schemaUnknown: unknown = bazaar.schema;

  // If bazaar `info.input` is "flattened" payload fields (no `body` wrapper),
  // and bazaar.schema is a standard JSON Schema `{type, properties, required}`,
  // treat it as a POST JSON body schema so the UI can render fields.
  if (schemaUnknown && typeof schemaUnknown === 'object') {
    const schemaObj = schemaUnknown as Record<string, unknown>;
    const properties = schemaObj.properties;
    const required = schemaObj.required;

    const reservedKeys = new Set([
      'method',
      'body',
      'bodyFields',
      'queryParams',
      'headerFields',
      'headers',
      'pathParams',
      'params',
    ]);
    const inputKeys = Object.keys(input);
    const hasReservedKey = inputKeys.some(k => reservedKeys.has(k));
    const hasNonReservedKeys = inputKeys.some(k => !reservedKeys.has(k));

    const isJsonSchemaLike =
      properties && typeof properties === 'object' && properties !== null;

    if (!hasReservedKey && hasNonReservedKeys && isJsonSchemaLike) {
      return {
        input: {
          method: 'POST',
          body: {
            ...schemaObj,
            properties,
            required: Array.isArray(required) ? required : undefined,
          },
        },
        output: info.output,
      } as unknown as OutputSchema;
    }
  }

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

  // Enrich queryParams with schema if info.queryParams is missing/empty (GET endpoints)
  if (bazaar.schema) {
    const qpVal = input.queryParams;
    const qpObj =
      qpVal && typeof qpVal === 'object' && !Array.isArray(qpVal)
        ? (qpVal as Record<string, unknown>)
        : undefined;
    const qpHasProperties = qpObj ? 'properties' in qpObj : false;
    const qpKeys = qpObj ? Object.keys(qpObj) : [];

    if (
      !qpHasProperties &&
      (qpVal === undefined || qpVal === null || qpKeys.length === 0)
    ) {
      const schema = bazaar.schema as {
        properties?: { input?: { properties?: { queryParams?: unknown } } };
      };
      const querySchema = schema.properties?.input?.properties?.queryParams;
      const querySchemaObj =
        querySchema && typeof querySchema === 'object'
          ? (querySchema as Record<string, unknown>)
          : undefined;
      if (querySchemaObj && 'properties' in querySchemaObj) {
        return {
          input: { ...input, queryParams: querySchemaObj },
          output: info.output,
        } as unknown as OutputSchema;
      }
    }
  }

  return { input: info.input, output: info.output } as OutputSchema;
}

// NOTE(shafu): we need this for the agent tools
// obviously sloped up, should be fine though because the interface won't change
export function coerceAcceptForV1Schema(params: {
  x402Version: number;
  accept: unknown;
}): Record<string, unknown> {
  const { x402Version, accept } = params;

  const base =
    accept && typeof accept === 'object'
      ? ({ ...(accept as Record<string, unknown>) } as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  if ('maxAmountRequired' in base) {
    const v = base.maxAmountRequired;
    if (typeof v === 'bigint') base.maxAmountRequired = v.toString();
    else if (typeof v === 'number') base.maxAmountRequired = String(v);
  }

  if (x402Version === 2) {
    const outputSchema = base.outputSchema;
    const coerced = (() => {
      if (!outputSchema || typeof outputSchema !== 'object') return undefined;
      if (!('input' in outputSchema)) return undefined;

      const schemaObj = outputSchema as { input?: unknown; output?: unknown };
      if (!schemaObj.input || typeof schemaObj.input !== 'object') {
        return undefined;
      }

      const input = { ...(schemaObj.input as Record<string, unknown>) };

      // Infer method if missing (bazaar often omits it)
      let inferredMethod: 'GET' | 'POST' = 'GET';
      if (input.body) inferredMethod = 'POST';
      else if (input.queryParams) inferredMethod = 'GET';
      if (!('method' in input)) input.method = inferredMethod;

      // Convert `body.properties` -> `bodyFields` (v1 expects Record<string, FieldDef>)
      if (
        input.body &&
        typeof input.body === 'object' &&
        input.body !== null &&
        'properties' in (input.body as Record<string, unknown>)
      ) {
        input.bodyFields = (
          input.body as { properties?: Record<string, unknown> }
        ).properties;
        delete input.body;
      }

      const parsed = outputSchemaV1.safeParse({
        input,
        output: schemaObj.output ?? null,
      });
      return parsed.success ? parsed.data : undefined;
    })();

    if (coerced) base.outputSchema = coerced;
    else if ('outputSchema' in base) base.outputSchema = undefined;
  }

  return base;
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
  // v2 - check header first using @x402/core
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
    if (suffix === 'mainnet') return 'solana';
    if (suffix === 'devnet') return 'solana_devnet';
    if (suffix === 'testnet') return 'solana_testnet';
    if (suffix === '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp') return 'solana';
    if (suffix === 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1') return 'solana_devnet';
    if (suffix === '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z') return 'solana_testnet';
    return `solana_${suffix}`;
  }
  return chainId;
}
