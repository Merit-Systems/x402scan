import { z } from 'zod';
import { ok, err } from '@x402scan/neverthrow';

import { log } from '@/shared/log';
import {
  safeFetch,
  safeFetchJson,
  safeParseResponse,
} from '@/shared/neverthrow/fetch';

/**
 * Discovery document schema (x402 v1)
 */
export const discoveryDocumentSchema = z.object({
  version: z.number().refine(v => v === 1, { message: 'version must be 1' }),
  resources: z.array(z.string()),
  ownershipProofs: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

export type DiscoveryDocument = z.infer<typeof discoveryDocumentSchema>;

/**
 * Discovery source types
 */
export type DiscoverySource = 'well-known' | 'dns-txt' | 'llms-txt';

/**
 * Discovery success result
 */
export interface DiscoverySuccessResult {
  found: true;
  origin: string;
  source: DiscoverySource;
  data: DiscoveryDocument | { text: string };
  usage?: string;
}

const ERROR_TYPE = 'discovery';

/**
 * Discover x402-protected resources on an origin.
 * Tries: .well-known/x402, DNS TXT record, llms.txt
 */
export async function discoverResources(surface: string, url: string) {
  const origin = URL.canParse(url) ? new URL(url).origin : url;
  const hostname = URL.canParse(origin) ? new URL(origin).hostname : origin;

  log.info(`Discovering resources for origin: ${origin}`);

  // Step 1: Try .well-known/x402
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

  // Step 2: Try DNS TXT record _x402.hostname
  const dnsQuery = `_x402.${hostname}`;
  log.debug(`Looking up DNS TXT record: ${dnsQuery}`);

  const dnsResult = await safeFetchJson(
    surface,
    new Request(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(dnsQuery)}&type=TXT`,
      { headers: { Accept: 'application/dns-json' } }
    ),
    z.object({
      Answer: z
        .array(
          z.object({
            data: z.string(),
          })
        )
        .optional(),
    })
  );

  if (
    dnsResult.isOk() &&
    dnsResult.value.Answer &&
    dnsResult.value.Answer.length > 0
  ) {
    const dnsUrl = dnsResult.value.Answer[0]!.data.replace(/^"|"$/g, '');
    if (URL.canParse(dnsUrl)) {
      const dnsDocResult = await safeFetchJson(
        surface,
        new Request(dnsUrl, { headers: { Accept: 'application/json' } }),
        discoveryDocumentSchema
      );

      if (dnsDocResult.isOk()) {
        return ok<DiscoverySuccessResult>({
          found: true,
          origin,
          source: 'dns-txt',
          data: dnsDocResult.value,
        });
      }
    } else {
      log.debug(`DNS TXT value is not a valid URL: ${dnsUrl}`);
    }
  } else {
    log.info(`No DNS TXT record found for ${dnsQuery}`);
  }

  // Step 3: Try llms.txt as last resort
  const llmsTxtUrl = `${origin}/llms.txt`;
  log.debug(`Fetching llms.txt from: ${llmsTxtUrl}`);

  const llmsResult = await safeFetch(
    surface,
    new Request(llmsTxtUrl, { headers: { Accept: 'text/plain' } })
  );

  if (llmsResult.isOk()) {
    const parseResult = await safeParseResponse(surface, llmsResult.value);
    if (parseResult.isOk() && parseResult.value.type === 'text') {
      return ok<DiscoverySuccessResult>({
        found: true,
        origin,
        source: 'llms-txt',
        usage:
          'Found llms.txt but no structured x402 discovery document. The content below may contain information about x402 resources. Parse it to find relevant endpoints.',
        data: { text: parseResult.value.data },
      });
    }
  }

  // No discovery document found
  return err(ERROR_TYPE, surface, {
    cause: 'not_found' as const,
    message: `No discovery document found for ${origin}. Tried: .well-known/x402, DNS TXT record, llms.txt`,
    origin,
  });
}
