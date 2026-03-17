import type { registryRegisterOriginBodySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { registerResource, toX402PaymentOptions } from '@/lib/resources';

import { checkEndpointSchema } from '@agentcash/discovery';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { deprecateStaleResources } from '@/services/db/resources/resource';
import { getValidationIssueMessages } from '@/types/validation';

import type { z } from 'zod';

const PROBE_TIMEOUT_MS = 15000;

function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (!err || typeof err !== 'object') return 'Unknown error';
  if ('type' in err && typeof err.type === 'string') {
    const details: string[] = [];
    if ('parseErrors' in err && Array.isArray(err.parseErrors)) {
      details.push(...(err.parseErrors as string[]));
    } else if ('issues' in err && Array.isArray(err.issues)) {
      details.push(...getValidationIssueMessages(err.issues as unknown[]));
    } else if ('upsertErrors' in err && Array.isArray(err.upsertErrors)) {
      details.push(...(err.upsertErrors as string[]));
    }
    return details.length > 0 ? `${err.type}: ${details.join(', ')}` : err.type;
  }
  return 'Unknown error';
}

export async function handleRegistryRegisterOrigin(
  body: z.infer<typeof registryRegisterOriginBodySchema>
) {
  const { origin } = body;
  const discoveryResult = await fetchDiscoveryDocument(origin);

  if (!discoveryResult.success) {
    return jsonResponse(
      {
        success: false,
        error: {
          type: 'no_discovery',
          message: discoveryResult.error ?? 'No discovery document found',
        },
      },
      404
    );
  }

  const results = await Promise.allSettled(
    discoveryResult.resources.map(async resource => {
      const resourceUrl = resource.url;

      const check = await checkEndpointSchema({
        url: resourceUrl,
        sampleInputBody: {},
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      });

      if (!check.found) {
        return {
          success: false as const,
          url: resourceUrl,
          error: 'Endpoint not found',
          status: undefined,
        };
      }

      for (const advisory of check.advisories) {
        const x402Options = toX402PaymentOptions(advisory.paymentOptions ?? []);
        if (x402Options.length === 0) continue;
        if (!advisory.inputSchema) continue;

        const result = await registerResource(resourceUrl, {
          paymentOptions: x402Options,
          inputSchema: advisory.inputSchema,
          outputSchema: advisory.outputSchema,
          paymentRequiredBody: advisory.paymentRequiredBody,
        });

        if (result.success) return result;
        const errorMsg = getErrorMessage(result.error) || 'Registration failed';
        return {
          success: false as const,
          url: resourceUrl,
          error: errorMsg,
          status: undefined,
        };
      }

      return {
        success: false as const,
        url: resourceUrl,
        error: 'No x402 payment options found',
        status: undefined,
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
          error: 'error' in value ? (value.error as string) : 'Unknown error',
          status: 'status' in value ? (value.status as number | undefined) : undefined,
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
}
