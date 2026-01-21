/**
 * Discovery tool - discover x402 resources from an origin's well-known endpoint
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { log } from '@/lib/log';
import { mcpError, mcpSuccess } from '@/server/lib/response';
import { tokenStringToNumber } from '@/lib/token';
import { getChainName } from '@/lib/networks';
import { x402Client, x402HTTPClient } from '@x402/core/client';

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

/**
 * Lookup DNS TXT record for _x402.hostname using DNS-over-HTTPS
 * Returns the URL path from the TXT record if found
 */
async function lookupDnsTxtRecord(hostname: string): Promise<string | null> {
  const dnsQuery = `_x402.${hostname}`;
  log.debug(`Looking up DNS TXT record: ${dnsQuery}`);

  try {
    // Use Cloudflare DNS-over-HTTPS
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(
        dnsQuery
      )}&type=TXT`,
      {
        headers: { Accept: 'application/dns-json' },
      }
    );

    if (!response.ok) {
      log.debug(`DNS lookup failed: HTTP ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      Answer?: { data: string }[];
    };

    if (!data.Answer || data.Answer.length === 0) {
      log.debug('No DNS TXT record found');
      return null;
    }

    // TXT record data comes with quotes, strip them
    const txtValue = data.Answer[0].data.replace(/^"|"$/g, '');
    log.debug(`Found DNS TXT record: ${txtValue}`);

    // Validate it's a URL
    try {
      new URL(txtValue);
      return txtValue;
    } catch {
      log.debug(`DNS TXT value is not a valid URL: ${txtValue}`);
      return null;
    }
  } catch (err) {
    log.debug(
      `DNS lookup error: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
}

/**
 * Fetch llms.txt from origin - returns raw content since it won't be properly formatted
 */
async function fetchLlmsTxt(
  origin: string
): Promise<{ found: boolean; content?: string; error?: string }> {
  const llmsTxtUrl = `${origin}/llms.txt`;
  log.debug(`Fetching llms.txt from: ${llmsTxtUrl}`);

  try {
    const response = await fetch(llmsTxtUrl, {
      headers: { Accept: 'text/plain' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { found: false, error: 'No llms.txt found' };
      }
      return { found: false, error: `HTTP ${response.status}` };
    }

    const content = await response.text();
    if (!content || content.trim().length === 0) {
      return { found: false, error: 'llms.txt is empty' };
    }

    return { found: true, content };
  } catch (err) {
    return {
      found: false,
      error: `Network error: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

interface FetchResult {
  found: boolean;
  source?: DiscoverySource;
  document?: DiscoveryDocument;
  llmsTxtContent?: string;
  error?: string;
  rawResponse?: unknown;
  attemptedSources: string[];
}

/**
 * Fetch discovery document from a specific URL
 */
async function fetchDiscoveryFromUrl(url: string): Promise<{
  found: boolean;
  document?: DiscoveryDocument;
  error?: string;
  rawResponse?: unknown;
}> {
  log.debug(`Fetching discovery document from: ${url}`);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { found: false, error: `Not found at ${url}` };
      }
      return {
        found: false,
        error: `HTTP ${response.status}: ${await response.text()}`,
      };
    }

    let rawData: unknown;
    try {
      rawData = await response.json();
    } catch {
      return {
        found: false,
        error: 'Failed to parse discovery document as JSON',
      };
    }

    // Validate against schema
    const parsed = DiscoveryDocumentSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        found: false,
        error: `Invalid discovery document: ${parsed.error.issues
          .map(e => e.message)
          .join(', ')}`,
        rawResponse: rawData,
      };
    }

    return { found: true, document: parsed.data };
  } catch (err) {
    return {
      found: false,
      error: `Network error: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

/**
 * Fetch discovery document with fallback chain:
 * 1. .well-known/x402
 * 2. DNS _x402 TXT record pointing to discovery URL
 * 3. llms.txt (raw content, not structured)
 */
async function fetchDiscoveryDocument(origin: string): Promise<FetchResult> {
  const attemptedSources: string[] = [];
  const hostname = getHostname(origin);

  // 1. Try .well-known/x402
  const wellKnownUrl = `${origin}/.well-known/x402`;
  attemptedSources.push(wellKnownUrl);
  const wellKnownResult = await fetchDiscoveryFromUrl(wellKnownUrl);

  if (wellKnownResult.found && wellKnownResult.document) {
    return {
      found: true,
      source: 'well-known',
      document: wellKnownResult.document,
      attemptedSources,
    };
  }

  // 2. Try DNS TXT record _x402.hostname
  attemptedSources.push(`DNS TXT _x402.${hostname}`);
  const dnsUrl = await lookupDnsTxtRecord(hostname);

  if (dnsUrl) {
    attemptedSources.push(dnsUrl);
    const dnsResult = await fetchDiscoveryFromUrl(dnsUrl);

    if (dnsResult.found && dnsResult.document) {
      return {
        found: true,
        source: 'dns-txt',
        document: dnsResult.document,
        attemptedSources,
      };
    }
  }

  // 3. Try llms.txt as last resort
  attemptedSources.push(`${origin}/llms.txt`);
  const llmsResult = await fetchLlmsTxt(origin);

  if (llmsResult.found && llmsResult.content) {
    return {
      found: true,
      source: 'llms-txt',
      llmsTxtContent: llmsResult.content,
      attemptedSources,
    };
  }

  // Nothing found
  return {
    found: false,
    error:
      'No discovery document found. Tried: .well-known/x402, DNS TXT record, llms.txt',
    attemptedSources,
  };
}

/**
 * Query a resource URL using the same logic as query_endpoint tool
 * Returns full pricing, bazaar schema, and SIWX info
 */
async function queryResource(url: string): Promise<DiscoveredResource> {
  log.debug(`Querying resource: ${url}`);

  try {
    const result = await fetch(url, { method: 'GET' });

    if (!result.ok) {
      return {
        url,
        isX402Endpoint: false,
        error: result.statusText ?? 'Failed to query endpoint',
      };
    }

    if (result.status !== 402) {
      return {
        url,
        isX402Endpoint: false,
      };
    }

    const pr = new x402HTTPClient(new x402Client()).getPaymentRequiredResponse(
      name => result.headers.get(name),
      JSON.parse(await result.text())
    );

    const firstReq = pr.accepts[0]!;

    const resource: DiscoveredResource = {
      url,
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
      // Extract description from bazaar info if available
      const info = bazaar.info as { description?: string } | undefined;
      if (info?.description) {
        resource.description = info.description;
      }
    }

    // Extract SIWX info
    if (pr.extensions?.['sign-in-with-x']) {
      const siwx = pr.extensions['sign-in-with-x'] as { info?: unknown };
      resource.signInWithX = { required: true, info: siwx.info };
    }

    return resource;
  } catch (err) {
    return {
      url,
      isX402Endpoint: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
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
            Serper Google search and news
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
      try {
        const origin = getOrigin(url);
        log.info(`Discovering resources for origin: ${origin}`);

        // Fetch the discovery document using fallback chain:
        // 1. .well-known/x402
        // 2. DNS TXT _x402.hostname
        // 3. llms.txt (raw content)
        const discoveryResult = await fetchDiscoveryDocument(origin);

        // Handle llms.txt case - return raw content for LLM to interpret
        if (discoveryResult.found && discoveryResult.source === 'llms-txt') {
          return mcpSuccess({
            found: true,
            origin,
            source: 'llms-txt',
            usage:
              'Found llms.txt but no structured x402 discovery document. The content below may contain information about x402 resources. Parse it to find relevant endpoints.',
            llmsTxtContent: discoveryResult.llmsTxtContent,
            attemptedSources: discoveryResult.attemptedSources,
            resources: [],
          });
        }

        if (!discoveryResult.found || !discoveryResult.document) {
          return mcpSuccess({
            found: false,
            origin,
            error: discoveryResult.error,
            attemptedSources: discoveryResult.attemptedSources,
            rawResponse: discoveryResult.rawResponse,
          });
        }

        const doc = discoveryResult.document;
        const result: DiscoveryResult = {
          found: true,
          origin,
          source: discoveryResult.source,
          instructions: doc.instructions,
          usage:
            'Use query_endpoint to get full pricing/requirements for a resource. Use execute_call (for payment) or authed_call (for SIWX auth) to call it.',
          resources: [],
        };

        // If not testing resources, just return the URLs from discovery doc
        if (!fanOut) {
          result.resources = doc.resources.map(resourceUrl => ({
            url: resourceUrl,
          }));
          return mcpSuccess(result);
        }

        // Query resources with concurrency limit to get full pricing/schema info
        const resourceUrls = doc.resources;
        const allResources: DiscoveredResource[] = [];

        // Process in batches based on concurrency
        for (let i = 0; i < resourceUrls.length; i += concurrency) {
          const batch = resourceUrls.slice(i, i + concurrency);
          const batchResults = await Promise.all(
            batch.map(resourceUrl => queryResource(resourceUrl))
          );
          allResources.push(...batchResults);
        }

        result.resources = allResources;

        return mcpSuccess(result);
      } catch (err) {
        return mcpError(err, { tool: 'discover_resources', url });
      }
    }
  );
}

function getOrigin(urlString: string): string {
  try {
    return new URL(urlString).origin;
  } catch {
    return urlString;
  }
}

function getHostname(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch {
    return origin;
  }
}
