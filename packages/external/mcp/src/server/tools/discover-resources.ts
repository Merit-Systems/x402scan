import { z } from 'zod';

import { log } from '@/shared/log';
import {
  safeFetch,
  safeFetchJson,
  safeParseResponse,
} from '@/shared/neverthrow/fetch';

import { mcpErrorJson, mcpSuccessJson } from './response';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const discoveryDocumentSchema = z.object({
  version: z.number().refine(v => v === 1, { message: 'version must be 1' }),
  resources: z.array(z.url()),
  ownershipProofs: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

const toolName = 'discover_api_endpoints';

export function registerDiscoveryTools(server: McpServer): void {
  server.registerTool(
    toolName,
    {
      title: 'Discover API Endpoints',
      description: `Discover x402-protected resources on an origin. Returns a list of resource URLs.
        Use check_x402_endpoint separately to get detailed pricing/schema info for specific resources.

        Known default origins with resource packs. Discover if more needed:
        - https://enrichx402.com ->
            People + Org search
            Google Maps (places + locations)
            Grok twitter search
            Exa web search
            Clado linkedin data
            Firecrawl web scrape
        - https://stablestudio.io -> generate images / videos
        `,
      inputSchema: {
        url: z
          .url()
          .describe(
            'The origin URL or any URL on the origin to discover resources from'
          ),
      },
    },
    async ({ url }) => {
      const origin = URL.canParse(url) ? new URL(url).origin : url;
      const hostname = URL.canParse(origin) ? new URL(origin).hostname : origin;
      log.info(`Discovering resources for origin: ${origin}`);

      // ============================================================
      // Step 1: Try .well-known/x402
      // ============================================================
      const wellKnownUrl = `${origin}/.well-known/x402`;
      log.debug(`Fetching discovery document from: ${wellKnownUrl}`);

      const wellKnownResult = await safeFetchJson(
        toolName,
        new Request(wellKnownUrl, { headers: { Accept: 'application/json' } }),
        discoveryDocumentSchema
      );

      if (wellKnownResult.isOk()) {
        return mcpSuccessJson({
          found: true,
          origin,
          source: 'well-known',
          data: wellKnownResult.value,
        });
      } else {
        log.info(
          `No well-known x402 discovery document found at ${wellKnownUrl}`
        );
      }

      // ============================================================
      // Step 2: Try DNS TXT record _x402.hostname
      // ============================================================
      const dnsQuery = `_x402.${hostname}`;
      log.debug(`Looking up DNS TXT record: ${dnsQuery}`);

      const dnsResult = await safeFetchJson(
        toolName,
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
            toolName,
            new Request(dnsUrl, { headers: { Accept: 'application/json' } }),
            discoveryDocumentSchema
          );

          if (dnsDocResult.isOk()) {
            return mcpSuccessJson({
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

      // ============================================================
      // Step 3: Try llms.txt as last resort
      // ============================================================
      const llmsTxtUrl = `${origin}/llms.txt`;
      log.debug(`Fetching llms.txt from: ${llmsTxtUrl}`);

      const llmsResult = await safeFetch(
        toolName,
        new Request(llmsTxtUrl, { headers: { Accept: 'text/plain' } })
      );

      if (llmsResult.isOk()) {
        const parseResult = await safeParseResponse(toolName, llmsResult.value);
        if (parseResult.isOk() && parseResult.value.type === 'text') {
          return mcpSuccessJson({
            found: true,
            origin,
            source: 'llms-txt',
            usage:
              'Found llms.txt but no structured x402 discovery document. The content below may contain information about x402 resources. Parse it to find relevant endpoints.',
            data: parseResult.value,
          });
        }
      }

      return mcpErrorJson({
        found: false,
        origin,
        error:
          'No discovery document found. Tried: .well-known/x402, DNS TXT record, llms.txt',
      });
    }
  );
}
