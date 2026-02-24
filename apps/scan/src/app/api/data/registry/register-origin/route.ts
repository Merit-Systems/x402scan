import type { NextRequest } from 'next/server';

import { registryRegisterOriginBodySchema } from '@/app/api/data/_lib/schemas';
import {
  parseJsonBody,
  jsonResponse,
  errorResponse,
} from '@/app/api/data/_lib/utils';
import { registerResource } from '@/lib/resources';
import { extractX402Data } from '@/lib/x402';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { deprecateStaleResources } from '@/services/db/resources/resource';
import { Methods } from '@/types/x402';

const PROBE_TIMEOUT_MS = 15000;

export const POST = async (request: NextRequest) => {
  const parsed = await parseJsonBody(request, registryRegisterOriginBodySchema);
  if (!parsed.success) return parsed.response;

  const { origin } = parsed.data;

  const discoveryResult = await fetchDiscoveryDocument(origin);

  if (!discoveryResult.success) {
    return errorResponse(
      discoveryResult.error ?? 'No discovery document found',
      404
    );
  }

  const results = await Promise.allSettled(
    discoveryResult.resources.map(async resource => {
      const resourceUrl = resource.url;
      const methodsToTry = [Methods.POST, Methods.GET];

      let lastError = 'No 402 response';
      let lastStatus: number | undefined;
      const errors: string[] = [];

      for (const method of methodsToTry) {
        try {
          const response = await fetch(resourceUrl, {
            method,
            headers:
              method === Methods.POST
                ? { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' }
                : { 'Cache-Control': 'no-cache' },
            body: method === Methods.POST ? '{}' : undefined,
            signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
            cache: 'no-store',
          });

          lastStatus = response.status;

          if (response.status === 402) {
            const x402Data = await extractX402Data(response);
            const result = await registerResource(resourceUrl, x402Data);

            if (result.success) {
              return result;
            }

            const errorMsg = getErrorMessage(result.error) || 'Registration failed';
            errors.push(`${method}: ${errorMsg}`);
            lastError = errors.join('; ');
          } else {
            errors.push(`${method}: Expected 402, got ${response.status}`);
            lastError = errors.join('; ');
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Request failed';
          errors.push(`${method}: ${errorMsg}`);
          lastError = errors.join('; ');
        }
      }

      return {
        success: false as const,
        url: resourceUrl,
        error: lastError,
        status: lastStatus,
      };
    })
  );

  const successfulResults: { url: string }[] = [];
  const failedResults: { url: string; error: string; status?: number }[] = [];
  let originId: string | undefined;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const resourceUrl = discoveryResult.resources[i]?.url ?? 'unknown';

    if (!result) continue;

    if (result.status === 'fulfilled' && result.value) {
      const value = result.value;
      if ('success' in value && value.success) {
        successfulResults.push({ url: resourceUrl });
        if (!originId && 'resource' in value && value.resource?.origin?.id) {
          originId = value.resource.origin.id;
        }
      } else if ('success' in value && !value.success) {
        failedResults.push({
          url: resourceUrl,
          error: value.error,
          status: 'status' in value ? value.status : undefined,
        });
      }
    } else if (result.status === 'rejected') {
      failedResults.push({
        url: resourceUrl,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : 'Promise rejected',
      });
    }
  }

  let deprecated = 0;
  if (originId) {
    const activeResourceUrls = discoveryResult.resources.map(r => r.url);
    deprecated = await deprecateStaleResources(originId, activeResourceUrls);
  }

  return jsonResponse({
    success: true,
    registered: successfulResults.length,
    failed: failedResults.length,
    deprecated,
    total: results.length,
    source: discoveryResult.source,
    failedDetails: failedResults.length > 0 ? failedResults : undefined,
  });
};

function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (!err || typeof err !== 'object') return 'Unknown error';

  if ('type' in err && typeof err.type === 'string') {
    const details: string[] = [];
    if ('parseErrors' in err && Array.isArray(err.parseErrors)) {
      details.push(...(err.parseErrors as string[]));
    } else if ('upsertErrors' in err && Array.isArray(err.upsertErrors)) {
      details.push(...(err.upsertErrors as string[]));
    }
    return details.length > 0
      ? `${err.type}: ${details.join(', ')}`
      : err.type;
  }

  return 'Unknown error';
}
