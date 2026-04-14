import { scrapeOriginData } from '@/services/scraper';
import { upsertResource } from '@/services/db/resources/resource';
import { upsertOrigin } from '@/services/db/resources/origin';

import type { EndpointMethodAdvisory } from '@agentcash/discovery';
import { isX402PaymentOption } from '@/lib/discovery/utils';

import { getOriginFromUrl } from '@/lib/url';

import { upsertResourceResponse } from '@/services/db/resources/response';
import { formatTokenAmount } from './token';
import { SUPPORTED_CHAINS } from '@/types/chain';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { verifyAcceptsOwnership } from '@/services/verification/accepts-verification';
import { outputSchemaV1 } from '@/lib/x402/v1';
import {
  normalizeChainId,
  parseX402Response,
  getOutputSchema,
  type ParsedX402Response,
} from '@/lib/x402';

import type { AcceptsNetwork } from '@x402scan/scan-db';

import type { OutputSchemaV1 } from '@/lib/x402/v1';

/**
 * Convert OpenAPI-format inputSchema from the discovery package into
 * the v1 output schema format that x402scan uses for rendering.
 *
 * The discovery package's `extractInputSchema` returns one of:
 *   - A bare JSON Schema (when only requestBody exists)
 *   - `{ requestBody: JsonSchema, parameters: OpenApiParam[] }`
 *   - `{ parameters: OpenApiParam[] }`
 */
function convertOpenApiSchemaToV1(
  inputSchema: Record<string, unknown>,
  method: string,
  outputSchema?: Record<string, unknown>
): OutputSchemaV1 | undefined {
  const input: Record<string, unknown> = {
    type: 'http',
    method: method.toUpperCase(),
  };

  // Determine if inputSchema is a bare JSON Schema or a wrapper with requestBody/parameters
  const hasRequestBody = 'requestBody' in inputSchema;
  const hasParameters =
    'parameters' in inputSchema && Array.isArray(inputSchema.parameters);
  const isBareJsonSchema =
    !hasRequestBody &&
    !hasParameters &&
    ('properties' in inputSchema || 'type' in inputSchema);

  // Extract bodyFields from requestBody or bare JSON Schema
  const bodySource = hasRequestBody
    ? (inputSchema.requestBody as Record<string, unknown>)
    : isBareJsonSchema
      ? inputSchema
      : undefined;

  if (bodySource) {
    const properties = bodySource.properties as
      | Record<string, unknown>
      | undefined;
    if (properties) {
      const bodyFields: Record<string, Record<string, unknown>> = {};
      for (const [name, schema] of Object.entries(properties)) {
        bodyFields[name] = openApiPropertyToFieldDef(
          name,
          schema,
          bodySource.required
        );
      }
      input.bodyFields = bodyFields;
      if (!('method' in input) || input.method === 'GET') {
        input.method = 'POST';
      }
    }
  }

  // Extract queryParams and headerFields from parameters.
  // Skip headers that are part of the x402/MPP payment protocol — these are
  // added automatically by the payment flow and should not be user-fillable.
  const PROTOCOL_HEADERS = new Set([
    'authorization',
    'payment-signature',
    'payment-required',
    'x-payment',
    'x-payment-signature',
    'sign-in-with-x',
  ]);

  if (hasParameters) {
    const parameters = inputSchema.parameters as Record<string, unknown>[];
    const queryParams: Record<string, Record<string, unknown>> = {};
    const headerFields: Record<string, Record<string, unknown>> = {};

    for (const param of parameters) {
      if (typeof param.name !== 'string') continue;
      const fieldDef = openApiParamToFieldDef(param);
      if (param.in === 'query') {
        queryParams[param.name] = fieldDef;
      } else if (
        param.in === 'header' &&
        !PROTOCOL_HEADERS.has(param.name.toLowerCase())
      ) {
        headerFields[param.name] = fieldDef;
      }
    }

    if (Object.keys(queryParams).length > 0) input.queryParams = queryParams;
    if (Object.keys(headerFields).length > 0) input.headerFields = headerFields;
  }

  // Need at least some schema fields to be useful
  if (!input.bodyFields && !input.queryParams && !input.headerFields) {
    return undefined;
  }

  return outputSchemaV1.safeParse({
    input,
    output: outputSchema ?? null,
  }).data;
}

function openApiPropertyToFieldDef(
  name: string,
  schema: unknown,
  requiredFields: unknown
): Record<string, unknown> {
  const s =
    typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : {};
  const isRequired =
    Array.isArray(requiredFields) && requiredFields.includes(name);

  return {
    ...(typeof s.type === 'string' ? { type: s.type } : {}),
    ...(isRequired ? { required: true } : {}),
    ...(typeof s.description === 'string'
      ? { description: s.description }
      : {}),
    ...(Array.isArray(s.enum) ? { enum: s.enum.map(String) } : {}),
    ...(s.properties ? { properties: s.properties } : {}),
    ...(s.items ? { items: s.items } : {}),
  };
}

function openApiParamToFieldDef(
  param: Record<string, unknown>
): Record<string, unknown> {
  const schema =
    typeof param.schema === 'object' && param.schema !== null
      ? (param.schema as Record<string, unknown>)
      : {};

  return {
    ...(typeof schema.type === 'string' ? { type: schema.type } : {}),
    ...(param.required === true ? { required: true } : {}),
    ...(typeof param.description === 'string'
      ? { description: param.description }
      : {}),
    ...(Array.isArray(schema.enum) ? { enum: schema.enum.map(String) } : {}),
  };
}

export const registerResource = async (
  url: string,
  advisory: EndpointMethodAdvisory
) => {
  const x402Options = (advisory.paymentOptions ?? []).filter(
    isX402PaymentOption
  );
  const urlObj = new URL(url);
  urlObj.search = '';
  const cleanUrl = urlObj.toString();

  if (x402Options.length === 0) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'parseResponse' as const,
        parseErrors: ['No payment options found'],
      },
    };
  }

  if (!advisory.inputSchema) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'parseResponse' as const,
        parseErrors: ['Missing input schema'],
      },
    };
  }

  // Try v1 parse first (works when inputSchema includes type/method)
  let outputSchemaForDb = outputSchemaV1.safeParse({
    input: advisory.inputSchema,
    output: advisory.outputSchema ?? null,
  }).data;
  let schemaSource = outputSchemaForDb ? 'v1' : undefined;

  // Fallback: use v2-aware extraction from raw 402 body
  if (!outputSchemaForDb && advisory.paymentRequiredBody) {
    const parsed = parseX402Response(advisory.paymentRequiredBody);
    if (parsed.success) {
      const extracted = getOutputSchema(parsed.data);
      if (extracted) {
        const input = extracted.input as Record<string, unknown>;
        if (!input.method && advisory.method) {
          input.method = advisory.method;
        }
        outputSchemaForDb = extracted;
        schemaSource = 'v2-bazaar';
      }
    }
  }

  // Fallback: convert raw OpenAPI-format inputSchema to v1 format.
  // The discovery package returns schemas from the OpenAPI spec as
  // { requestBody?: JsonSchema, parameters?: OpenApiParam[] } or a
  // bare JSON Schema when only a requestBody exists. Convert those
  // into the v1 { method, bodyFields, queryParams, headerFields } shape.
  if (!outputSchemaForDb && advisory.inputSchema) {
    const converted = convertOpenApiSchemaToV1(
      advisory.inputSchema,
      advisory.method,
      advisory.outputSchema
    );
    if (converted) {
      outputSchemaForDb = converted;
      schemaSource = 'openapi-converted';
    }
  }

  if (!outputSchemaForDb) {
    console.warn(
      `[registerResource] No output schema resolved for ${cleanUrl}`,
      `method=${advisory.method}`,
      `hasInputSchema=${!!advisory.inputSchema}`,
      `hasPaymentBody=${!!advisory.paymentRequiredBody}`,
      `inputSchemaKeys=${advisory.inputSchema ? Object.keys(advisory.inputSchema).join(',') : 'none'}`
    );
  } else {
    console.log(
      `[registerResource] Schema resolved via ${schemaSource} for ${cleanUrl}`
    );
  }

  const mappedAccepts = x402Options
    .map(opt => ({
      scheme: (opt.scheme ?? 'exact') as 'exact',
      network: normalizeChainId(opt.network).replace(
        '-',
        '_'
      ) as AcceptsNetwork,
      maxAmountRequired:
        ('amount' in opt ? opt.amount : opt.maxAmountRequired) ?? '0',
      payTo: opt.payTo ?? '',
      asset: opt.asset,
      maxTimeoutSeconds: opt.maxTimeoutSeconds ?? 60,
      outputSchema: outputSchemaForDb,
      extra: undefined,
    }))
    .filter(accept =>
      (SUPPORTED_CHAINS as readonly string[]).includes(accept.network)
    );

  const x402Version = x402Options[0]?.version ?? 1;

  const origin = getOriginFromUrl(cleanUrl);
  const { og, metadata, favicon } = await scrapeOriginData(origin);

  const title = metadata?.title ?? og?.ogTitle ?? null;
  const description = metadata?.description ?? og?.ogDescription ?? null;

  await upsertOrigin({
    origin,
    title: title ?? undefined,
    description: description ?? undefined,
    favicon: favicon ?? undefined,
    ogImages:
      og?.ogImage?.map(image => ({
        url: image.url,
        height: image.height,
        width: image.width,
        title: og.ogTitle,
        description: og.ogDescription,
      })) ?? [],
  });

  const resource = await upsertResource({
    resource: cleanUrl,
    type: 'http',
    x402Version,
    lastUpdated: new Date(),
    accepts: mappedAccepts,
  });

  if (!resource) {
    return {
      success: false as const,
      data: advisory.paymentRequiredBody,
      error: {
        type: 'database' as const,
        upsertErrors: ['Resource failed to upsert'],
      },
    };
  }

  await upsertResourceResponse(
    resource.resource.id,
    (advisory.paymentRequiredBody ?? {}) as ParsedX402Response
  );

  // Attempt ownership verification (non-blocking)
  void (async () => {
    try {
      const discoveryResult = await fetchDiscoveryDocument(origin);
      if (
        discoveryResult.success &&
        discoveryResult.ownershipProofs &&
        discoveryResult.ownershipProofs.length > 0
      ) {
        const acceptIds = resource.accepts.map(accept => accept.id);
        await verifyAcceptsOwnership({
          acceptIds,
          ownershipProofs: discoveryResult.ownershipProofs,
          origin,
        });
      }
    } catch (error) {
      console.error(
        'Ownership verification failed during registration:',
        error
      );
    }
  })();

  return {
    success: true as const,
    resource,
    accepts: resource.accepts.map(accept => ({
      ...accept,
      maxAmountRequired: formatTokenAmount(accept.maxAmountRequired),
    })),
    response: advisory.paymentRequiredBody,
    registrationDetails: {
      providedAccepts: mappedAccepts,
      supportedAccepts: resource.accepts,
      unsupportedAccepts: resource.unsupportedAccepts,
      originMetadata: {
        title,
        description,
        favicon: favicon ?? null,
        ogImages:
          og?.ogImage?.map(image => ({
            url: image.url,
            height: image.height,
            width: image.width,
          })) ?? [],
      },
    },
  };
};
