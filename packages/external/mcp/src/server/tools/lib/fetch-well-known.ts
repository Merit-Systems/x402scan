import z from 'zod';

import { log } from '@/shared/log';
import { safeFetchJson } from '@/shared/neverthrow/fetch';
import { err } from '@x402scan/neverthrow';

interface FetchWellKnownProps {
  surface: string;
  url: string;
}

const discoveryDocumentSchema = z.object({
  version: z.number().refine(v => v === 1, { message: 'version must be 1' }),
  resources: z.array(z.string()),
  ownershipProofs: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

export const fetchWellKnown = async ({ surface, url }: FetchWellKnownProps) => {
  const origin = URL.canParse(url) ? new URL(url).origin : url;
  const hostname = URL.canParse(origin) ? new URL(origin).hostname : origin;
  log.info(`Discovering resources for origin: ${origin}`);

  // ============================================================
  // Step 1: Try .well-known/x402
  // ============================================================
  const wellKnownUrl = `${origin}/.well-known/x402`;
  log.debug(`Fetching discovery document from: ${wellKnownUrl}`);

  const wellKnownResult = await safeFetchJson(
    surface,
    new Request(wellKnownUrl, { headers: { Accept: 'application/json' } }),
    discoveryDocumentSchema
  );

  if (wellKnownResult.isOk()) {
    return wellKnownResult;
  } else {
    log.info(`No well-known x402 discovery document found at ${wellKnownUrl}`);
  }

  // ============================================================
  // Step 2: Try DNS TXT record _x402.hostname
  // ============================================================
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
        return dnsDocResult;
      }
    } else {
      log.debug(`DNS TXT value is not a valid URL: ${dnsUrl}`);
    }
  } else {
    log.info(`No DNS TXT record found for ${dnsQuery}`);
  }

  return err('fetch-well-known', surface, {
    cause: 'not_found' as const,
    message: `No discovery document found for ${origin}`,
  });
};
