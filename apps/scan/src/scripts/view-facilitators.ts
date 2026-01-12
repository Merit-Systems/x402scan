/**
 * Script to view discoverable facilitators and their resources locally.
 *
 * Usage:
 *   pnpm view:facilitators
 *   pnpm view:facilitators -- --list-only
 *   pnpm view:facilitators -- --facilitator=coinbase
 *   pnpm view:facilitators -- --verbose
 *   pnpm view:facilitators -- --skip=coinbase
 *
 * Environment variables (for authenticated CDP requests):
 *   CDP_API_KEY_ID     - CDP API Key ID
 *   CDP_API_KEY_SECRET - CDP API Key Secret
 *
 * Automatically loads .env file from apps/scan/.env
 */

import 'dotenv/config';
import { generateJwt } from '@coinbase/cdp-sdk/auth';
import { useFacilitator as facilitatorUtils } from 'x402/verify';
import { discoverableFacilitators } from 'facilitators';

import type {
  FacilitatorConfig,
  ListDiscoveryResourcesRequest,
  ListDiscoveryResourcesResponse,
} from 'x402/types';

// ============================================================================
// Types
// ============================================================================

type FacilitatorResource = ListDiscoveryResourcesResponse['items'][number];

interface FetchOptions {
  delayMs?: number;
  onProgress?: (count: number, total: number) => void;
}

// ============================================================================
// CDP Authenticated Fetch
// ============================================================================

const CDP_HOST = 'api.cdp.coinbase.com';
const CDP_DISCOVERY_PATH = '/platform/v2/x402/discovery/resources';

/**
 * Check if CDP credentials are available
 */
function hasCdpCredentials(): boolean {
  return !!(process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET);
}

/**
 * Fetch from CDP API with JWT authentication
 */
async function cdpAuthenticatedFetch<T>(
  path: string,
  method: 'GET' | 'POST' = 'GET'
): Promise<{ data: T; rateLimitInfo?: RateLimitInfo }> {
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;

  if (!apiKeyId || !apiKeySecret) {
    throw new Error('CDP credentials not found in environment');
  }

  // Generate JWT (path without query params for signing)
  const [basePath] = path.split('?');
  const jwt = await generateJwt({
    apiKeyId,
    apiKeySecret,
    requestMethod: method,
    requestHost: CDP_HOST,
    requestPath: basePath!,
    expiresIn: 120,
  });

  const url = `https://${CDP_HOST}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  });

  // Extract rate limit info from headers
  const rateLimitInfo = extractRateLimitInfo(response.headers);

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      throw new Error(
        `Rate limited (429)${retryAfter ? `, retry after ${retryAfter}s` : ''}`
      );
    }
    const errorBody = await response.text();
    throw new Error(`CDP API error ${response.status}: ${errorBody}`);
  }

  return { data: (await response.json()) as T, rateLimitInfo };
}

interface RateLimitInfo {
  limit?: number;
  remaining?: number;
  reset?: number;
  retryAfter?: number;
}

function extractRateLimitInfo(headers: Headers): RateLimitInfo | undefined {
  const info: RateLimitInfo = {};

  // Common rate limit headers
  const limit =
    headers.get('x-ratelimit-limit') ?? headers.get('ratelimit-limit');
  const remaining =
    headers.get('x-ratelimit-remaining') ?? headers.get('ratelimit-remaining');
  const reset =
    headers.get('x-ratelimit-reset') ?? headers.get('ratelimit-reset');
  const retryAfter = headers.get('retry-after');

  if (limit) info.limit = parseInt(limit, 10);
  if (remaining) info.remaining = parseInt(remaining, 10);
  if (reset) info.reset = parseInt(reset, 10);
  if (retryAfter) info.retryAfter = parseInt(retryAfter, 10);

  return Object.keys(info).length > 0 ? info : undefined;
}

// Track rate limit info globally for logging
let lastRateLimitInfo: RateLimitInfo | undefined;

/**
 * Fetch a page of resources from CDP with authentication
 */
async function listCdpResourcesAuthenticated(
  config?: ListDiscoveryResourcesRequest
): Promise<ListDiscoveryResourcesResponse> {
  const params = new URLSearchParams();
  if (config?.offset !== undefined) params.set('offset', String(config.offset));
  if (config?.limit !== undefined) params.set('limit', String(config.limit));

  const queryString = params.toString();
  const path = queryString
    ? `${CDP_DISCOVERY_PATH}?${queryString}`
    : CDP_DISCOVERY_PATH;

  const { data, rateLimitInfo } =
    await cdpAuthenticatedFetch<ListDiscoveryResourcesResponse>(path);

  if (rateLimitInfo) {
    lastRateLimitInfo = rateLimitInfo;
  }

  return data;
}

// ============================================================================
// Resource Fetching
// ============================================================================

/**
 * Fetches a single page of resources from a facilitator.
 */
async function listFacilitatorResources(
  facilitator: FacilitatorConfig,
  config?: ListDiscoveryResourcesRequest
): Promise<ListDiscoveryResourcesResponse> {
  // Use authenticated fetch for CDP if credentials available
  if (facilitator.url.includes(CDP_HOST) && hasCdpCredentials()) {
    return listCdpResourcesAuthenticated(config);
  }

  // Some facilitators (like anyspend) wrap response in { data: { items, pagination } }
  // Try direct fetch to handle non-standard responses
  if (facilitator.url.includes('anyspend')) {
    return fetchAnyspendResources(facilitator, config);
  }

  const result = await facilitatorUtils(facilitator).list(config);

  // Validate response structure
  if (!result || !Array.isArray(result.items)) {
    throw new Error(
      `Invalid response format: expected { items: [], pagination: {} }, got ${JSON.stringify(result).slice(0, 200)}`
    );
  }

  return result;
}

/**
 * Fetch from anyspend which wraps response in { data: { items, pagination } }
 */
async function fetchAnyspendResources(
  facilitator: FacilitatorConfig,
  config?: ListDiscoveryResourcesRequest
): Promise<ListDiscoveryResourcesResponse> {
  const params = new URLSearchParams();
  if (config?.offset !== undefined) params.set('offset', String(config.offset));
  if (config?.limit !== undefined) params.set('limit', String(config.limit));

  const queryString = params.toString();
  const url = `${facilitator.url}/discovery/resources${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Anyspend API error ${response.status}`);
  }

  const json = (await response.json()) as {
    success: boolean;
    data: ListDiscoveryResourcesResponse;
  };

  if (!json.success || !json.data?.items) {
    throw new Error(`Anyspend returned unsuccessful response`);
  }

  return json.data;
}

/**
 * Fetches all resources from a facilitator with rate-limit handling.
 */
async function listAllFacilitatorResources(
  facilitator: FacilitatorConfig,
  options: FetchOptions = {}
): Promise<FacilitatorResource[]> {
  const { delayMs = 100, onProgress } = options;
  const allItems: FacilitatorResource[] = [];
  let offset = 0;
  let hasMore = true;
  let backoff = 1000;
  const maxBackoff = 32000;

  // CDP has aggressive rate limits even with auth, use provided delay
  const effectiveDelay = delayMs;

  while (hasMore) {
    try {
      const { pagination, items } = await listFacilitatorResources(
        facilitator,
        {
          offset,
          limit: 100,
        }
      );
      allItems.push(...items);

      onProgress?.(allItems.length, pagination.total);

      if (pagination.total > pagination.offset + pagination.limit) {
        hasMore = true;
        offset += pagination.limit;
        if (effectiveDelay > 0) {
          await new Promise(res => setTimeout(res, effectiveDelay));
        }
      } else {
        hasMore = false;
      }
      backoff = 1000;
    } catch (err) {
      const isRateLimit =
        err instanceof Error &&
        (err.message.toLowerCase().includes('429') ||
          err.message.toLowerCase().includes('rate'));

      if (isRateLimit) {
        // Check for retry-after in error message
        const retryMatch = /retry after (\d+)s/.exec(err.message);
        const retryAfter = retryMatch?.[1]
          ? parseInt(retryMatch[1], 10) * 1000
          : null;
        const waitTime = retryAfter ?? backoff;

        // Log rate limit info if available
        if (lastRateLimitInfo) {
          log(
            'dim',
            `   Rate limit: ${lastRateLimitInfo.remaining ?? '?'}/${lastRateLimitInfo.limit ?? '?'} remaining`
          );
        }

        log('yellow', `   ⏳ Rate limited, retrying in ${waitTime / 1000}s...`);
        await new Promise(res => setTimeout(res, waitTime));
        backoff = retryAfter ? 1000 : Math.min(backoff * 2, maxBackoff);
        continue;
      } else {
        throw err;
      }
    }
  }
  return allItems;
}

// ============================================================================
// Console Output
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
};

function log(color: keyof typeof COLORS, ...args: unknown[]) {
  console.log(COLORS[color], ...args, COLORS.reset);
}

function printFacilitator(
  facilitator: (typeof discoverableFacilitators)[0],
  isAuthenticated: boolean
) {
  log('cyan', `\n${'─'.repeat(60)}`);
  const authBadge = isAuthenticated ? ' 🔐' : '';
  log('bright', `📡 ${facilitator.url}${authBadge}`);
}

function printResourceSummary(resources: FacilitatorResource[]) {
  const byType = resources.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const networks = new Set(
    resources.flatMap(r => r.accepts.map(a => a.network))
  );

  log('green', `   Resources: ${resources.length}`);
  log('dim', `   By type: ${JSON.stringify(byType)}`);
  log('dim', `   Networks: ${Array.from(networks).join(', ')}`);
}

function printResources(resources: FacilitatorResource[]) {
  for (const resource of resources.slice(0, 10)) {
    log('yellow', `\n   🔗 ${resource.resource}`);
    log('dim', `      Type: ${resource.type}`);
    log('dim', `      x402 Version: ${resource.x402Version}`);
    log('dim', `      Last Updated: ${String(resource.lastUpdated)}`);

    for (const accept of resource.accepts) {
      log('magenta', `      💰 ${accept.network} - ${accept.scheme}`);
      log('dim', `         Pay To: ${accept.payTo}`);
      log('dim', `         Max Amount: ${accept.maxAmountRequired}`);
      log('dim', `         Asset: ${accept.asset}`);
      if (accept.description) {
        log(
          'dim',
          `         Description: ${accept.description.slice(0, 100)}...`
        );
      }
    }
  }

  if (resources.length > 10) {
    log('dim', `\n   ... and ${resources.length - 10} more resources`);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const listOnly = args.includes('--list-only');
  const facilitatorFilter = args
    .find(a => a.startsWith('--facilitator='))
    ?.split('=')[1];
  const skipFilter = args.find(a => a.startsWith('--skip='))?.split('=')[1];
  const verbose = args.includes('--verbose') || args.includes('-v');
  const delayArg = args.find(a => a.startsWith('--delay='))?.split('=')[1];
  const delayMs = delayArg ? parseInt(delayArg, 10) : 500;

  log('bright', '\n🔍 Discoverable Facilitators\n');
  log('dim', `Found ${discoverableFacilitators.length} facilitators`);

  if (hasCdpCredentials()) {
    log(
      'green',
      `CDP credentials detected - authenticated requests enabled 🔐\n`
    );
  } else {
    log(
      'yellow',
      `No CDP credentials - using unauthenticated requests (may be rate limited)\n`
    );
    log(
      'dim',
      `Set CDP_API_KEY_ID and CDP_API_KEY_SECRET for authenticated access\n`
    );
  }

  let facilitators = discoverableFacilitators;

  if (facilitatorFilter) {
    facilitators = facilitators.filter(f =>
      f.url.toLowerCase().includes(facilitatorFilter.toLowerCase())
    );
    if (facilitators.length === 0) {
      log('red', `No facilitators found matching "${facilitatorFilter}"`);
      process.exit(1);
    }
  }

  if (skipFilter) {
    const skips = skipFilter.split(',');
    facilitators = facilitators.filter(
      f => !skips.some(skip => f.url.toLowerCase().includes(skip.toLowerCase()))
    );
  }

  if (listOnly) {
    for (const facilitator of facilitators) {
      const isAuth = facilitator.url.includes(CDP_HOST) && hasCdpCredentials();
      printFacilitator(facilitator, isAuth);
    }
    return;
  }

  let totalResources = 0;

  for (const facilitator of facilitators) {
    const isAuthenticated =
      facilitator.url.includes(CDP_HOST) && hasCdpCredentials();
    printFacilitator(facilitator, isAuthenticated);

    try {
      const startTime = Date.now();
      const resources = await listAllFacilitatorResources(facilitator, {
        delayMs,
        onProgress: (count, total) => {
          process.stdout.write(
            `\r   📥 Fetching: ${count}/${total} resources...`
          );
        },
      });
      process.stdout.write('\r' + ' '.repeat(50) + '\r');
      const duration = Date.now() - startTime;

      printResourceSummary(resources);
      log('dim', `   Fetched in ${(duration / 1000).toFixed(1)}s`);

      if (verbose) {
        printResources(resources);
      }

      totalResources += resources.length;
    } catch (error) {
      log(
        'red',
        `   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  log('cyan', `\n${'─'.repeat(60)}`);
  log(
    'bright',
    `\n📊 Total: ${totalResources} resources from ${facilitators.length} facilitators\n`
  );
}

main().catch(console.error);
