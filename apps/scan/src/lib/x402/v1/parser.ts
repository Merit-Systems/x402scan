import type { NormalizedX402Response, ParseResult } from '../types';
import { normalizeX402FieldsV1 } from './normalize';
import type { X402ResponseV1 } from './schema';
import { x402ResponseSchemaV1 } from './schema';

export function parseV1(data: unknown): ParseResult<NormalizedX402Response> {
  const normalized = normalizeX402FieldsV1(data);
  const result = x402ResponseSchemaV1.safeParse(normalized);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(issue => issue.message),
    };
  }
  return { success: true, version: 1, data: toNormalizedFormat(result.data) };
}

function toNormalizedFormat(v1: X402ResponseV1): NormalizedX402Response {
  const firstAccept = v1.accepts?.[0];

  return {
    version: 1,
    error: v1.error,
    payer: v1.payer,
    accepts: (v1.accepts ?? [])
      .filter((a): a is typeof a & { network: string } => !!a.network)
      .map(a => ({
        scheme: a.scheme,
        network: a.network,
        amount: a.maxAmountRequired,
        payTo: a.payTo,
        maxTimeoutSeconds: a.maxTimeoutSeconds,
        asset: a.asset,
        extra: a.extra,
      })),
    resourceInfo: firstAccept
      ? {
          resource: firstAccept.resource,
          description: firstAccept.description,
          mimeType: firstAccept.mimeType,
          outputSchema: firstAccept.outputSchema
            ? {
                input: firstAccept.outputSchema.input,
                output: firstAccept.outputSchema.output ?? undefined, // Convert null to undefined
              }
            : undefined,
        }
      : undefined,
  };
}
