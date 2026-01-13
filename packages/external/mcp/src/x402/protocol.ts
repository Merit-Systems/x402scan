/**
 * x402 protocol handling - v1/v2 normalization and schema extraction
 */

import type { PaymentRequired, PaymentRequirements } from '@x402/core/types';

// Normalized types - use these downstream
export interface NormalizedRequirement {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
  // v1-only fields preserved for display
  resource?: string;
  description?: string;
  mimeType?: string;
}

export interface NormalizedPaymentRequired {
  x402Version: number;
  error?: string;
  accepts: NormalizedRequirement[];
  resource?: { url: string; description: string; mimeType: string };
  extensions?: Record<string, unknown>;
}

// v1 raw types
interface RawV1Requirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  outputSchema?: Record<string, unknown>;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: Record<string, unknown>;
}

/** Detect v1 response format (uses maxAmountRequired instead of amount) */
export function isV1Response(pr: unknown): boolean {
  if (!pr || typeof pr !== 'object') return false;
  const obj = pr as Record<string, unknown>;
  if (obj.x402Version === 1) return true;
  const accepts = obj.accepts;
  if (Array.isArray(accepts) && accepts.length > 0) {
    return 'maxAmountRequired' in accepts[0];
  }
  return false;
}

function normalizeV1Requirement(req: RawV1Requirement): NormalizedRequirement {
  if (!req.maxAmountRequired) {
    throw new Error('v1 requirement missing maxAmountRequired field');
  }
  return {
    scheme: req.scheme,
    network: req.network,
    amount: req.maxAmountRequired,
    asset: req.asset,
    payTo: req.payTo,
    maxTimeoutSeconds: req.maxTimeoutSeconds,
    extra: req.extra,
    resource: req.resource,
    description: req.description,
    mimeType: req.mimeType,
  };
}

function normalizeV2Requirement(
  req: PaymentRequirements
): NormalizedRequirement {
  if (!req.amount) {
    throw new Error('v2 requirement missing amount field');
  }
  return {
    scheme: req.scheme,
    network: req.network,
    amount: req.amount,
    asset: req.asset,
    payTo: req.payTo,
    maxTimeoutSeconds: req.maxTimeoutSeconds,
    extra: req.extra,
  };
}

/** Normalize v1/v2 payment required to consistent format */
export function normalizePaymentRequired(
  pr: PaymentRequired | Record<string, unknown>
): NormalizedPaymentRequired {
  const version = (pr as { x402Version?: number }).x402Version ?? 1;

  if (isV1Response(pr)) {
    const v1 = pr as { error?: string; accepts: RawV1Requirement[] };
    return {
      x402Version: 1,
      error: v1.error,
      accepts: v1.accepts.map(normalizeV1Requirement),
    };
  }

  const v2 = pr as PaymentRequired;
  return {
    x402Version: version,
    error: v2.error,
    accepts: v2.accepts.map(normalizeV2Requirement),
    resource: v2.resource,
    extensions: v2.extensions,
  };
}

// V1 schema extraction (inline to avoid @x402/extensions ESM/ajv issue)

interface V1OutputSchema {
  input: {
    type: string;
    method: string;
    discoverable?: boolean;
    queryParams?: Record<string, unknown>;
    body?: Record<string, unknown>;
    bodyFields?: Record<string, unknown>;
    headers?: Record<string, string>;
  };
  output?: Record<string, unknown>;
}

interface V1Accept {
  outputSchema?: V1OutputSchema;
}

/** Extract discovery info from v1 outputSchema */
export function extractV1Schema(
  accept: unknown
): Record<string, unknown> | null {
  const v1 = accept as V1Accept;
  const schema = v1?.outputSchema;
  if (schema?.input?.type !== 'http' || !schema.input.method) {
    return null;
  }
  if (schema.input.discoverable === false) {
    return null;
  }

  const method = schema.input.method.toUpperCase();
  const isBodyMethod = ['POST', 'PUT', 'PATCH'].includes(method);

  return {
    input: {
      type: 'http',
      method,
      ...(schema.input.queryParams && {
        queryParams: schema.input.queryParams,
      }),
      ...(isBodyMethod &&
        (schema.input.body ?? schema.input.bodyFields) && {
          bodyType: 'json',
          body: schema.input.body ?? schema.input.bodyFields,
        }),
      ...(schema.input.headers && { headers: schema.input.headers }),
    },
    ...(schema.output && { output: { type: 'json', example: schema.output } }),
  };
}
