import { z as z3 } from 'zod3';

export * from './v1';
export * from './v2';
export * from './schema';
export type { FieldDef } from './shared';

import {
  x402ResponseSchemaV1,
  outputSchemaV1,
  type X402ResponseV1,
  type OutputSchemaV1,
} from './v1';
import {
  x402ResponseSchemaV2,
  type X402ResponseV2,
  type BazaarDiscovery,
  type BazaarInputStructure,
  type BazaarJsonSchema,
} from './v2';
import { decodePaymentRequiredHeader } from '@x402/core/http';
import { ChainIdToNetwork } from './chain-mapping';
import {
  jsonObjectSchema3,
  jsonValueSchema3,
  type ParseResult,
} from './shared';
import { cleanExternalText } from '@/lib/utils';

import type { JsonObject, JsonValue } from '@/lib/json';

/**
 * The input structure of a bazaar-derived output schema: the raw bazaar
 * `info.input` structure, optionally enriched with JSON-Schema nodes taken
 * from the bazaar `schema` document. `type` aliases (not `interface`s) so
 * they get implicit index signatures, keeping them assignable to Prisma's
 * structural JSON input types.
 */
export type BazaarSchemaInput = {
  type?: string;
  method?: string;
  bodyType?: string;
  body?: JsonValue | BazaarJsonSchema;
  queryParams?: JsonValue | BazaarJsonSchema;
  bodyFields?: JsonValue;
  headerFields?: JsonValue;
  headers?: JsonValue;
  pathParams?: JsonValue;
  params?: JsonValue;
};

/** Output schema assembled from a v2 bazaar discovery extension. */
type BazaarOutputSchema = {
  input: BazaarSchemaInput;
  output?: JsonValue;
};

export type OutputSchema = OutputSchemaV1 | BazaarOutputSchema;
export type InputSchema = OutputSchema['input'];

/**
 * NOTE(shafu): we need this because we want to store the accept in
 * the database in a common format for v1 and v2.
 */
export const normalizedAcceptSchema = z3.object({
  scheme: z3.string().min(1),
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

export type ParsedX402Response = X402ResponseV1 | X402ResponseV2;

const v2VersionProbeSchema = z3.object({ x402Version: z3.literal(2) });

function toParseFailure(error: z3.ZodError): ParseResult<never> {
  return {
    success: false,
    errors: error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
  };
}

export function parseX402Response<T>(data: T): ParseResult<ParsedX402Response> {
  if (v2VersionProbeSchema.safeParse(data).success) {
    const result = x402ResponseSchemaV2.safeParse(data);
    if (!result.success) return toParseFailure(result.error);
    return { success: true, data: result.data };
  }
  const result = x402ResponseSchemaV1.safeParse(data);
  if (!result.success) return toParseFailure(result.error);
  return { success: true, data: result.data };
}

/**
 * NOTE(shafu): get the output schema from a parsed x402 response
 * V1: outputSchema is in accepts[].outputSchema (bodyFields format)
 * V2: outputSchema comes from extensions.bazaar (info + schema)
 */
export function getOutputSchema(
  response: X402ResponseV1
): OutputSchemaV1 | undefined;
export function getOutputSchema(
  response: ParsedX402Response
): OutputSchema | undefined;
export function getOutputSchema(
  response: ParsedX402Response
): OutputSchema | undefined {
  if (!isV2Response(response)) {
    return response.accepts?.[0]?.outputSchema;
  }

  const bazaar = response.extensions?.bazaar;
  return bazaar ? getOutputSchemaFromBazaar(bazaar) : undefined;
}

const jsonContainerSchema3 = z3.union([
  jsonObjectSchema3,
  z3.array(jsonValueSchema3),
]);

// NOTE(shafu): merge example data from info with field definitions from schema.
function getOutputSchemaFromBazaar(
  bazaar: BazaarDiscovery
): OutputSchema | undefined {
  const info = bazaar.info;
  if (!info?.input) {
    // Missing/invalid bazaar input schema should be handled as a validation
    // issue upstream; never throw here.
    return undefined;
  }

  const input: BazaarInputStructure = info.input;
  const schema = bazaar.schema;

  // If bazaar `info.input` is "flattened" payload fields (no `body` wrapper),
  // and bazaar.schema is a standard JSON Schema `{type, properties, required}`,
  // treat it as a POST JSON body schema so the UI can render fields.
  if (schema) {
    const properties = schema.properties;
    const required = schema.required;

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

    if (!hasReservedKey && hasNonReservedKeys && properties) {
      return {
        input: {
          method: 'POST',
          body: {
            ...schema,
            properties,
            required,
          },
        },
        output: info.output,
      };
    }
  }

  // Enrich body with schema if info.body has example data (no properties)
  if (schema) {
    const bodyContainer = jsonContainerSchema3.safeParse(input.body);
    const bodySchema = schema.properties?.input?.properties?.body;
    if (
      input.body &&
      bodyContainer.success &&
      !('properties' in bodyContainer.data) &&
      bodySchema?.properties
    ) {
      return {
        input: { ...input, body: bodySchema },
        output: info.output,
      };
    }
  }

  // Enrich queryParams with schema if info.queryParams is missing/empty (GET endpoints)
  if (schema) {
    const qpVal = input.queryParams;
    const qpParsed = jsonObjectSchema3.safeParse(qpVal);
    const qpObj = qpVal && qpParsed.success ? qpParsed.data : undefined;
    const qpHasProperties = qpObj ? 'properties' in qpObj : false;
    const qpKeys = qpObj ? Object.keys(qpObj) : [];

    if (
      !qpHasProperties &&
      (qpVal === undefined || qpVal === null || qpKeys.length === 0)
    ) {
      const querySchema = schema.properties?.input?.properties?.queryParams;
      if (querySchema?.properties) {
        return {
          input: { ...input, queryParams: querySchema },
          output: info.output,
        };
      }
    }
  }

  return { input, output: info.output };
}

/**
 * A candidate v2 `outputSchema` value on an accept: an `input` structure plus
 * optional `output` example/schema data.
 */
const v2OutputSchemaCandidateSchema = z3.object({
  input: jsonObjectSchema3,
  output: jsonValueSchema3.optional(),
});

// NOTE(shafu): we need this for the agent tools
export function coerceAcceptForV1Schema<
  A extends {
    maxAmountRequired?: string | number | bigint;
    outputSchema?: unknown;
  },
>(params: { x402Version: number; accept: A }) {
  const { x402Version, accept } = params;
  const { maxAmountRequired, outputSchema, ...rest } = accept;

  const coercedOutputSchema = (() => {
    if (x402Version !== 2) return outputSchema;

    const candidate = v2OutputSchemaCandidateSchema.safeParse(outputSchema);
    if (!candidate.success) return undefined;

    const input: JsonObject = { ...candidate.data.input };

    // Infer method if missing (bazaar often omits it)
    if (!('method' in input)) {
      input.method = input.body ? 'POST' : 'GET';
    }

    // Convert `body.properties` -> `bodyFields` (v1 expects Record<string, FieldDef>)
    const body = jsonObjectSchema3.safeParse(input.body);
    if (body.success) {
      const bodyProperties = body.data.properties;
      if (bodyProperties !== undefined) {
        input.bodyFields = bodyProperties;
        delete input.body;
      }
    }

    const parsed = outputSchemaV1.safeParse({
      input,
      output: candidate.data.output ?? null,
    });
    return parsed.success ? parsed.data : undefined;
  })();

  return {
    ...rest,
    maxAmountRequired:
      maxAmountRequired === undefined ? undefined : String(maxAmountRequired),
    outputSchema: coercedOutputSchema,
  };
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
 *
 * Applies mojibake repair (UTF-8 bytes misread as Latin-1) and HTML entity
 * decoding since descriptions come from external servers with inconsistent
 * encoding.
 */
export function getDescription(
  response: ParsedX402Response
): string | undefined {
  const raw = isV2Response(response)
    ? response.resource?.description
    : response.accepts?.find(a => a.description)?.description;
  if (!raw) return raw;
  return cleanExternalText(raw);
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
  let result = chainId;
  if (chainId.startsWith('eip155:')) {
    const id = Number(chainId.split(':')[1]);
    result = ChainIdToNetwork[id] ?? chainId;
  } else if (chainId.startsWith('solana:')) {
    const suffix = chainId.split(':')[1];
    if (suffix === 'mainnet') result = 'solana';
    else if (suffix === 'devnet') result = 'solana_devnet';
    else if (suffix === 'testnet') result = 'solana_testnet';
    else if (suffix === '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp') result = 'solana';
    else if (suffix === 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1')
      result = 'solana_devnet';
    else if (suffix === '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z')
      result = 'solana_testnet';
    else result = `solana_${suffix}`;
  }
  return result.replaceAll('-', '_');
}
