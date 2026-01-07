import type { NormalizedX402Response, ParseResult } from '../types';
import { normalizeChainId } from './normalize';
import type { X402ResponseV2 } from './schema';
import { x402ResponseSchemaV2 } from './schema';

export function parseV2(data: unknown): ParseResult<NormalizedX402Response> {
  const result = x402ResponseSchemaV2.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map(
        issue => `${issue.path.join('.')}: ${issue.message}`
      ),
    };
  }
  return { success: true, version: 2, data: toNormalizedFormat(result.data) };
}

function toNormalizedFormat(v2: X402ResponseV2): NormalizedX402Response {
  return {
    version: 2,
    error: v2.error,
    payer: v2.payer,
    accepts: (v2.accepts ?? []).map(a => ({
      scheme: a.scheme,
      network: normalizeChainId(a.network), // Convert ChainId to network name
      amount: a.amount, // V2 uses 'amount' directly
      payTo: a.payTo,
      maxTimeoutSeconds: a.maxTimeoutSeconds,
      asset: a.asset,
      extra: a.extra,
    })),
    // V2 has resourceInfo at top level, not embedded in accepts
    resourceInfo: v2.resourceInfo
      ? {
          resource: v2.resourceInfo.resource,
          description: v2.resourceInfo.description,
          mimeType: v2.resourceInfo.mimeType,
          outputSchema: v2.resourceInfo.outputSchema
            ? {
                input: v2.resourceInfo.outputSchema.input,
                output: v2.resourceInfo.outputSchema.output ?? undefined,
              }
            : undefined,
        }
      : undefined,
  };
}