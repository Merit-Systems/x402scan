import type { registryRegisterOriginBodySchema } from '@/app/api/x402/_lib/schemas';
import { jsonResponse } from '@/app/api/x402/_lib/utils';
import { fetchDiscoveryDocument } from '@/services/discovery';
import { registerResourcesFromDiscovery } from '@/lib/discovery/register-origin';

import type { z } from 'zod';

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

  const result = await registerResourcesFromDiscovery(
    discoveryResult.resources,
    discoveryResult.source
  );

  return jsonResponse({
    success: true,
    registered: result.registered,
    siwx: result.siwx,
    failed: result.failed,
    skipped: result.skipped,
    deprecated: result.deprecated,
    total: result.total,
    source: result.source,
    failedDetails:
      result.failedDetails.length > 0 ? result.failedDetails : undefined,
    siwxDetails: result.siwxDetails.length > 0 ? result.siwxDetails : undefined,
  });
}
