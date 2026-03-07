import { z } from 'zod';
import { ok, err } from '@x402scan/neverthrow';
import type { Result } from '@x402scan/neverthrow/types';

import { log } from '@/shared/log';
import { safeFetchJson } from '@/shared/neverthrow/fetch';

/**
 * Discovery document schema (x402 v1)
 */
const discoveryDocumentSchema = z.object({
  version: z.number().refine(v => v === 1, { message: 'version must be 1' }),
  resources: z.array(z.string()),
  ownershipProofs: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

type DiscoveryDocument = z.infer<typeof discoveryDocumentSchema>;

/**
 * Discovery source types
 */
type DiscoverySource = 'well-known';

/**
 * Discovery success result
 */
interface DiscoverySuccessResult {
  found: true;
  origin: string;
  source: DiscoverySource;
  data: DiscoveryDocument;
}

/**
 * Discovery error with origin context
 */
interface DiscoveryError {
  cause: 'not_found';
  message: string;
  origin: string;
}

const ERROR_TYPE = 'discovery';

/**
 * Discover x402-protected resources on an origin.
 * Tries: .well-known/x402
 */
export async function discoverResources(
  surface: string,
  url: string
): Promise<Result<DiscoverySuccessResult, DiscoveryError>> {
  const origin = URL.canParse(url) ? new URL(url).origin : url;

  log.info(`Discovering resources for origin: ${origin}`);

  // Try .well-known/x402
  const wellKnownUrl = `${origin}/.well-known/x402`;
  log.debug(`Fetching discovery document from: ${wellKnownUrl}`);

  const wellKnownResult = await safeFetchJson(
    surface,
    new Request(wellKnownUrl, { headers: { Accept: 'application/json' } }),
    discoveryDocumentSchema
  );

  if (wellKnownResult.isOk()) {
    return ok<DiscoverySuccessResult>({
      found: true,
      origin,
      source: 'well-known',
      data: wellKnownResult.value,
    });
  } else {
    log.info(`No well-known x402 discovery document found at ${wellKnownUrl}`);
  }

  // No discovery document found
  return err(ERROR_TYPE, surface, {
    cause: 'not_found' as const,
    message: `No discovery document found for ${origin}. Tried: .well-known/x402`,
    origin,
  });
}
