/**
 * Discovery tool - discover x402 resources from an origin's well-known endpoint
 */

import { z } from 'zod';

import { x402Client, x402HTTPClient } from '@x402/core/client';

import { safeFetch } from '@/shared/neverthrow/fetch';
import { mcpSuccessJson } from './response';

import { log } from '@/shared/log';
import { tokenStringToNumber } from '@/shared/token';
import { getChainName } from '@/shared/networks';

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const toolName = 'discover-resources';

// Discovery document schema per spec
const DiscoveryDocumentSchema = z.object({
  version: z.number().refine(v => v === 1, { message: 'version must be 1' }),
  resources: z.array(z.url()),
  ownershipProofs: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

type DiscoveryDocument = z.infer<typeof DiscoveryDocumentSchema>;

type DiscoverySource = 'well-known' | 'dns-txt' | 'llms-txt';

interface DiscoveredResource {
  url: string;
  isX402Endpoint?: boolean;
  description?: string;
  price?: number;
  priceRaw?: string;
  network?: string;
  networkName?: string;
  x402Version?: number;
  bazaar?: {
    info?: unknown;
    schema?: unknown;
  };
  signInWithX?: {
    required: boolean;
    info?: unknown;
  };
  error?: string;
}

interface DiscoveryResult {
  found: boolean;
  origin: string;
  source?: DiscoverySource;
  instructions?: string;
  usage: string;
  resources: DiscoveredResource[];
  llmsTxtContent?: string;
  error?: string;
}

export function registerDiscoveryTools(server: McpServer): void {
  server.registerTool(
    'discover_resources',
    {
      description: `Discover x402-protected resources on an origin.
         NEVER use 'fanOut = true' on the first try.
         NEVER use 'fanOut = true' when there are more than 8 resources.

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
        fanOut: z
          .boolean()
          .default(false)
          .describe(
            'Whether to query each discovered resource for full pricing/schema info. NEVER use on first try.'
          ),
        concurrency: z
          .number()
          .int()
          .min(1)
          .max(10)
          .default(5)
          .describe(
            'Max concurrent requests when querying resources (default: 5)'
          ),
      },
    },
    async ({ url, fanOut, concurrency }) => {
      const origin = URL.canParse(url) ? new URL(url).origin : url;
      const hostname = URL.canParse(origin) ? new URL(origin).hostname : origin;
      log.info(`Discovering resources for origin: ${origin}`);

      const attemptedSources: string[] = [];
      let discoveryDocument: DiscoveryDocument | undefined;
      let discoverySource: DiscoverySource | undefined;
      let llmsTxtContent: string | undefined;

      // ============================================================
      // Step 1: Try .well-known/x402
      // ============================================================
      const wellKnownUrl = `${origin}/.well-known/x402`;
      attemptedSources.push(wellKnownUrl);
      log.debug(`Fetching discovery document from: ${wellKnownUrl}`);

      const wellKnownResult = await safeFetch(
        toolName,
        new Request(wellKnownUrl, { headers: { Accept: 'application/json' } })
      );

      if (wellKnownResult.isOk() && wellKnownResult.value.ok) {
        const rawData: unknown = await wellKnownResult.value
          .json()
          .then((data: unknown) => data)
          .catch(() => undefined);

        if (rawData) {
          const parsed = DiscoveryDocumentSchema.safeParse(rawData);
          if (parsed.success) {
            discoveryDocument = parsed.data;
            discoverySource = 'well-known';
          }
        }
      }

      // ============================================================
      // Step 2: Try DNS TXT record _x402.hostname
      // ============================================================
      if (!discoveryDocument) {
        const dnsQuery = `_x402.${hostname}`;
        attemptedSources.push(`DNS TXT ${dnsQuery}`);
        log.debug(`Looking up DNS TXT record: ${dnsQuery}`);

        const dnsResult = await safeFetch(
          toolName,
          new Request(
            `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(dnsQuery)}&type=TXT`,
            { headers: { Accept: 'application/dns-json' } }
          )
        );

        let dnsUrl: string | undefined;

        if (dnsResult.isOk() && dnsResult.value.ok) {
          const dnsData: { Answer?: { data: string }[] } | undefined =
            await dnsResult.value
              .json()
              .then((data: unknown) => data as { Answer?: { data: string }[] })
              .catch(() => undefined);

          if (dnsData?.Answer && dnsData.Answer.length > 0) {
            const txtValue = dnsData.Answer[0]!.data.replace(/^"|"$/g, '');
            log.debug(`Found DNS TXT record: ${txtValue}`);

            if (URL.canParse(txtValue)) {
              dnsUrl = txtValue;
            } else {
              log.debug(`DNS TXT value is not a valid URL: ${txtValue}`);
            }
          }
        }

        if (dnsUrl) {
          attemptedSources.push(dnsUrl);
          log.debug(`Fetching discovery document from DNS URL: ${dnsUrl}`);

          const dnsDocResult = await safeFetch(
            toolName,
            new Request(dnsUrl, { headers: { Accept: 'application/json' } })
          );

          if (dnsDocResult.isOk() && dnsDocResult.value.ok) {
            const rawData: unknown = await dnsDocResult.value
              .json()
              .then((data: unknown) => data)
              .catch(() => undefined);

            if (rawData) {
              const parsed = DiscoveryDocumentSchema.safeParse(rawData);
              if (parsed.success) {
                discoveryDocument = parsed.data;
                discoverySource = 'dns-txt';
              }
            }
          }
        }
      }

      // ============================================================
      // Step 3: Try llms.txt as last resort
      // ============================================================
      if (!discoveryDocument) {
        const llmsTxtUrl = `${origin}/llms.txt`;
        attemptedSources.push(llmsTxtUrl);
        log.debug(`Fetching llms.txt from: ${llmsTxtUrl}`);

        const llmsResult = await safeFetch(
          toolName,
          new Request(llmsTxtUrl, { headers: { Accept: 'text/plain' } })
        );

        if (llmsResult.isOk() && llmsResult.value.ok) {
          const content = await llmsResult.value.text();
          if (content && content.trim().length > 0) {
            llmsTxtContent = content;
            discoverySource = 'llms-txt';
          }
        }
      }

      // ============================================================
      // Step 4: Return results based on what was found
      // ============================================================

      // Handle llms.txt case - return raw content for LLM to interpret
      if (!discoveryDocument && llmsTxtContent) {
        return mcpSuccessJson({
          found: true,
          origin,
          source: 'llms-txt',
          usage:
            'Found llms.txt but no structured x402 discovery document. The content below may contain information about x402 resources. Parse it to find relevant endpoints.',
          llmsTxtContent,
          attemptedSources,
          resources: [],
        });
      }

      // Nothing found
      if (!discoveryDocument) {
        return mcpSuccessJson({
          found: false,
          origin,
          error:
            'No discovery document found. Tried: .well-known/x402, DNS TXT record, llms.txt',
          attemptedSources,
        });
      }

      // Build result from discovery document
      const result: DiscoveryResult = {
        found: true,
        origin,
        source: discoverySource,
        instructions: discoveryDocument.instructions,
        usage:
          'Use query_endpoint to get full pricing/requirements for a resource. Use execute_call (for payment) or authed_call (for SIWX auth) to call it.',
        resources: [],
      };

      // If not fanning out, just return the URLs from discovery doc
      if (!fanOut) {
        result.resources = discoveryDocument.resources.map(resourceUrl => ({
          url: resourceUrl,
        }));
        return mcpSuccessJson({ ...result });
      }

      // ============================================================
      // Step 5: Fan out - query each resource for full pricing/schema info
      // ============================================================
      const resourceUrls = discoveryDocument.resources;
      const allResources: DiscoveredResource[] = [];

      // Process in batches based on concurrency
      for (let i = 0; i < resourceUrls.length; i += concurrency) {
        const batch = resourceUrls.slice(i, i + concurrency);
        const batchResults = await Promise.all(
          batch.map(async (resourceUrl): Promise<DiscoveredResource> => {
            log.debug(`Querying resource: ${resourceUrl}`);

            const fetchResult = await safeFetch(
              toolName,
              new Request(resourceUrl, { method: 'GET' })
            );

            if (fetchResult.isErr()) {
              return {
                url: resourceUrl,
                isX402Endpoint: false,
                error: fetchResult.error.message,
              };
            }

            const response = fetchResult.value;

            if (!response.ok && response.status !== 402) {
              return {
                url: resourceUrl,
                isX402Endpoint: false,
                error: response.statusText || 'Failed to query endpoint',
              };
            }

            if (response.status !== 402) {
              return { url: resourceUrl, isX402Endpoint: false };
            }

            const body: unknown = await response
              .json()
              .then((data: unknown) => data)
              .catch(() => undefined);

            if (!body) {
              return {
                url: resourceUrl,
                isX402Endpoint: false,
                error: 'Failed to parse 402 response body',
              };
            }

            const pr = new x402HTTPClient(
              new x402Client()
            ).getPaymentRequiredResponse(
              name => response.headers.get(name),
              body
            );

            const firstReq = pr.accepts[0]!;

            const resource: DiscoveredResource = {
              url: resourceUrl,
              isX402Endpoint: true,
              x402Version: pr.x402Version,
              price: tokenStringToNumber(firstReq.amount),
              priceRaw: firstReq.amount,
              network: firstReq.network,
              networkName: getChainName(firstReq.network),
            };

            // Extract bazaar info
            if (pr.extensions?.bazaar) {
              const bazaar = pr.extensions.bazaar as {
                info?: unknown;
                schema?: unknown;
              };
              resource.bazaar = { info: bazaar.info, schema: bazaar.schema };
              const info = bazaar.info as { description?: string } | undefined;
              if (info?.description) {
                resource.description = info.description;
              }
            }

            // Extract SIWX info
            if (pr.extensions?.['sign-in-with-x']) {
              const siwx = pr.extensions['sign-in-with-x'] as {
                info?: unknown;
              };
              resource.signInWithX = { required: true, info: siwx.info };
            }

            return resource;
          })
        );
        allResources.push(...batchResults);
      }

      result.resources = allResources;

      return mcpSuccessJson({ ...result });
    }
  );
}
