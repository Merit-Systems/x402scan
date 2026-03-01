import z from 'zod';

import {
  createTRPCRouter,
  paginatedProcedure,
  publicProcedure,
} from '../../trpc';

import {
  getResource,
  getResourceByAddress,
  listResources,
  listResourcesWithPagination,
  searchResources,
  searchResourcesSchema,
  deprecateStaleResources,
  type ResourceSortId,
} from '@/services/db/resources/resource';

import { scanDb } from '@x402scan/scan-db';

import { mixedAddressSchema } from '@/lib/schemas';

import { Methods } from '@/types/x402';

import { registerResource } from '@/lib/resources';
import { extractX402Data } from '@/lib/x402';
import { TRPCError } from '@trpc/server';
import {
  listResourceTags,
  listTags,
  listTagsSchema,
} from '@/services/db/resources/tag';

import { convertTokenAmount } from '@/lib/token';
import { usdc } from '@/lib/tokens/usdc';
import { getOriginFromUrl, normalizeUrl } from '@/lib/url';
import { fetchDiscoveryDocument } from '@/services/discovery';
import {
  getResourceVerificationStatus,
  getOriginVerificationStatus,
} from '@/services/verification/accepts-verification';

import type { Prisma } from '@x402scan/scan-db';
import type { SupportedChain } from '@/types/chain';
import type { DiscoveryInfo, DiscoveredResource } from '@/types/discovery';

const BULK_REGISTER_CONCURRENCY = 6;
const METHOD_FALLBACKS = [Methods.DELETE, Methods.PUT, Methods.PATCH] as const;
const MAX_429_RETRIES_PER_METHOD = 1;
const RETRY_429_BASE_DELAY_MS = 300;
const RETRY_429_MAX_DELAY_MS = 1500;

function uniqueMethods(methods: Methods[]): Methods[] {
  return Array.from(new Set(methods));
}

function primaryMethodsToTry(resource: DiscoveredResource): Methods[] {
  if (resource.method) {
    return uniqueMethods([resource.method as Methods, Methods.POST, Methods.GET]);
  }
  return [Methods.POST, Methods.GET];
}

function probeInitForMethod(method: Methods): {
  headers: Record<string, string>;
  body?: string;
} {
  if (
    method === Methods.POST ||
    method === Methods.PUT ||
    method === Methods.PATCH
  ) {
    return {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: '{}',
    };
  }

  return {
    headers: { 'Cache-Control': 'no-cache' },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSiwxAuthOnlyChallenge(data: unknown): boolean {
  if (!isRecord(data)) return false;

  const acceptsValue = data.accepts;
  if (!Array.isArray(acceptsValue) || acceptsValue.length !== 0) {
    return false;
  }

  const extensionsValue = data.extensions;
  if (!isRecord(extensionsValue)) {
    return false;
  }

  return 'sign-in-with-x' in extensionsValue;
}

function isMissingInputSchemaError(err: unknown): boolean {
  if (!isRecord(err)) return false;
  if (err.type !== 'parseResponse') return false;

  const parseErrors = err.parseErrors;
  if (!Array.isArray(parseErrors)) return false;

  return parseErrors.some(
    message => typeof message === 'string' && message.includes('Missing input schema')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function parseRetryAfterMs(retryAfter: string | null): number | null {
  if (!retryAfter) return null;

  const asSeconds = Number.parseFloat(retryAfter);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.floor(asSeconds * 1000);
  }

  const asDate = Date.parse(retryAfter);
  if (Number.isNaN(asDate)) {
    return null;
  }

  return Math.max(0, asDate - Date.now());
}

async function mapSettledWithConcurrency<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>,
  concurrency = BULK_REGISTER_CONCURRENCY
): Promise<PromiseSettledResult<R>[]> {
  const results: (PromiseSettledResult<R> | undefined)[] = Array.from({
    length: items.length,
  });
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;

      if (current >= items.length) return;
      const item = items[current] as T;

      try {
        const value = await mapper(item, current);
        results[current] = {
          status: 'fulfilled',
          value,
        };
      } catch (reason) {
        results[current] = {
          status: 'rejected',
          reason,
        };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results.map((result, index) => {
    if (!result) {
      return {
        status: 'rejected',
        reason: new Error(`Missing result at index ${index}`),
      };
    }
    return result;
  });
}

export const resourcesRouter = createTRPCRouter({
  get: publicProcedure.input(z.string()).query(async ({ input }) => {
    const resource = await getResource(input);
    if (!resource) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
    }
    return {
      ...resource,
      accepts: resource.accepts.map(accept => ({
        ...accept,
        maxAmountRequired: convertTokenAmount(
          accept.maxAmountRequired,
          usdc(accept.network as SupportedChain).decimals
        ),
      })),
    };
  }),
  list: {
    all: publicProcedure.query(async () => {
      return await listResources({});
    }),
    paginated: paginatedProcedure
      .input(
        z.object({
          where: z.custom<Prisma.ResourcesWhereInput>().optional(),
          sorting: z
            .object({
              id: z.enum([
                'lastUpdated',
                'toolCalls',
              ] satisfies ResourceSortId[]),
              desc: z.boolean(),
            })
            .optional(),
          includeDeprecated: z.boolean().optional(),
        })
      )
      .query(async ({ input, ctx: { pagination } }) => {
        return await listResourcesWithPagination(
          {
            where: input.where,
            sorting: input.sorting,
            includeDeprecated: input.includeDeprecated,
          },
          pagination
        );
      }),
    byAddress: publicProcedure
      .input(mixedAddressSchema)
      .query(async ({ input }) => {
        return await listResources({
          accepts: {
            some: {
              payTo: input,
            },
          },
        });
      }),
  },
  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    return await scanDb.resources.findUnique({
      where: { id: input },
      include: {
        accepts: true,
        origin: true,
        response: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }),
  getResourceByAddress: publicProcedure
    .input(mixedAddressSchema)
    .query(async ({ input }) => {
      return await getResourceByAddress(input);
    }),
  search: publicProcedure
    .input(searchResourcesSchema)
    .query(async ({ input }) => {
      return await searchResources(input);
    }),

  register: publicProcedure
    .input(
      z.object({
        url: z.url(),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.object().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let parseErrorData: {
        parseErrors: string[];
        data: unknown;
      } | null = null;

      for (const method of [Methods.POST, Methods.GET]) {
        // ping resource
        const response = await fetch(
          input.url.replace('{', '').replace('}', ''),
          {
            method,
            headers:
              method === Methods.POST
                ? {
                    ...input.headers,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                  }
                : { ...input.headers, 'Cache-Control': 'no-cache' },
            body: input.body
              ? JSON.stringify(input.body)
              : method === Methods.POST
                ? '{}'
                : undefined,
            cache: 'no-store',
          }
        );

        // if it doesn't respond with a 402, continue to try next method
        if (response.status !== 402) {
          continue;
        }

        // Extract x402 data (handles v2 header and v1 body, with JSON parse fallback)
        const x402Data = await extractX402Data(response);

        const result = await registerResource(input.url.toString(), x402Data);

        if (result.success === false) {
          if (result.error.type === 'parseResponse') {
            parseErrorData = {
              data: result.data,
              parseErrors: result.error.parseErrors,
            };
            continue;
          } else {
            // Continue trying other methods instead of returning immediately
            parseErrorData = {
              data: result.data ?? null,
              parseErrors:
                'parseErrors' in result.error &&
                Array.isArray(result.error.parseErrors)
                  ? result.error.parseErrors
                  : [JSON.stringify(result.error)],
            };
            continue;
          }
        }

        // Check for additional resources via discovery
        const origin = getOriginFromUrl(input.url);
        let discovery: DiscoveryInfo = {
          found: false,
          otherResourceCount: 0,
          origin,
        };

        try {
          const discoveryResult = await fetchDiscoveryDocument(origin);
          if (
            discoveryResult.success &&
            Array.isArray(discoveryResult.resources)
          ) {
            // Filter out the URL that was just registered (normalize URLs for comparison)
            const inputUrlStr = String(input.url);
            const normalizedInputUrl = normalizeUrl(inputUrlStr);
            const otherResources = discoveryResult.resources.filter(r => {
              if (
                !r ||
                typeof r !== 'object' ||
                !('url' in r) ||
                typeof r.url !== 'string'
              ) {
                return false;
              }
              const resourceUrl = String(r.url);
              return normalizeUrl(resourceUrl) !== normalizedInputUrl;
            });
            discovery = {
              found: true,
              source: discoveryResult.source,
              otherResourceCount: otherResources.length,
              origin,
              resources: otherResources.map(r => r.url),
            };
          }
        } catch {
          // Discovery check failed, continue without discovery info
        }

        return {
          ...result,
          methodUsed: method,
          discovery,
        };
      }

      if (parseErrorData) {
        return {
          success: false as const,
          data: parseErrorData.data,
          error: {
            type: 'parseErrors' as const,
            parseErrors: parseErrorData.parseErrors,
          },
        };
      }

      return {
        success: false as const,
        error: {
          type: 'no402' as const,
        },
        type: 'no402' as const,
      };
    }),

  /**
   * Register all x402 resources discovered from an origin.
   * Uses DNS TXT records (_x402.{hostname}) or /.well-known/x402 for discovery.
   */
  registerFromOrigin: publicProcedure
    .input(
      z.object({
        origin: z.url(),
      })
    )
    .mutation(async ({ input }) => {
      const discoveryResult = await fetchDiscoveryDocument(input.origin);

      if (!discoveryResult.success) {
        return {
          success: false as const,
          error: {
            type: 'noDiscovery' as const,
            message: discoveryResult.error ?? 'No discovery document found',
          },
        };
      }

      // Helper to extract error message
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

      const results = await mapSettledWithConcurrency(
        discoveryResult.resources,
        async resource => {
          const resourceUrl = resource.url;
          const methodsToTry = primaryMethodsToTry(resource);

          let lastError = 'No 402 response';
          let lastStatus: number | undefined;
          const errors: string[] = [];
          const methodStatuses = new Map<Methods, number>();

          const tryMethod = async (method: Methods) => {
            try {
              const probeInit = probeInitForMethod(method);
              let response: Response;
              let retryCount = 0;

              while (true) {
                response = await fetch(resourceUrl, {
                  method,
                  headers: probeInit.headers,
                  body: probeInit.body,
                  signal: AbortSignal.timeout(15000),
                  cache: 'no-store',
                });

                if (
                  response.status === 429 &&
                  retryCount < MAX_429_RETRIES_PER_METHOD
                ) {
                  retryCount += 1;
                  const retryAfterMs = parseRetryAfterMs(
                    response.headers.get('retry-after')
                  );
                  const fallbackDelayMs =
                    RETRY_429_BASE_DELAY_MS + Math.floor(Math.random() * 200);
                  const delayMs = Math.min(
                    retryAfterMs ?? fallbackDelayMs,
                    RETRY_429_MAX_DELAY_MS
                  );
                  await sleep(delayMs);
                  continue;
                }

                break;
              }

              lastStatus = response.status;
              methodStatuses.set(method, response.status);

              if (response.status === 402) {
                // Extract x402 data (handles v2 header and v1 body, with JSON parse fallback)
                const x402Data = await extractX402Data(response);

                // Compat path: SIWX auth-only challenges are valid, but don't
                // include payment requirements and therefore aren't indexable
                // as payable resources in legacy x402scan.
                if (isSiwxAuthOnlyChallenge(x402Data)) {
                  return {
                    success: false as const,
                    skipped: true as const,
                    url: resourceUrl,
                    error:
                      'SIWX auth-only endpoint (no payment requirements to index)',
                    status: response.status,
                  };
                }

                const result = await registerResource(resourceUrl, x402Data);

                // If registration succeeded, return it
                if (result.success) {
                  return result;
                }

                if (isMissingInputSchemaError(result.error)) {
                  return {
                    success: false as const,
                    skipped: true as const,
                    url: resourceUrl,
                    error:
                      'Missing input schema (non-invocable endpoint skipped in strict mode)',
                    status: response.status,
                  };
                }

                // Registration failed, capture error but continue trying other methods
                const errorMsg =
                  getErrorMessage(result.error) || 'Registration failed';
                errors.push(`${method}: ${errorMsg}`);
                lastError = errors.join('; ');
              } else {
                const errorMsg = `Expected 402, got ${response.status}`;
                errors.push(`${method}: ${errorMsg}`);
                lastError = errors.join('; ');
              }
            } catch (err) {
              const errorMsg =
                err instanceof Error ? err.message : 'Request failed';
              errors.push(`${method}: ${errorMsg}`);
              lastError = errors.join('; ');
            }

            return null;
          };

          for (const method of methodsToTry) {
            const successfulResult = await tryMethod(method);
            if (successfulResult) {
              return successfulResult;
            }
          }

          // Legacy fallback: if discovery did not specify method and both
          // default probe methods are method-not-allowed, try uncommon methods.
          if (
            !resource.method &&
            methodStatuses.get(Methods.POST) === 405 &&
            methodStatuses.get(Methods.GET) === 405
          ) {
            for (const fallbackMethod of METHOD_FALLBACKS) {
              const successfulResult = await tryMethod(fallbackMethod);
              if (successfulResult) {
                return successfulResult;
              }
            }
          }

          return {
            success: false as const,
            url: resourceUrl,
            error: lastError,
            status: lastStatus,
          };
        }
      );

      // Separate successful and failed results with details
      const successfulResults: { url: string }[] = [];
      const failedResults: { url: string; error: string; status?: number }[] =
        [];
      const skippedResults: { url: string; error: string; status?: number }[] =
        [];
      let originId: string | undefined;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const resourceUrl = discoveryResult.resources[i]?.url ?? 'unknown';

        if (!result) continue;

        if (result.status === 'fulfilled' && result.value) {
          const value = result.value;
          if ('success' in value && value.success) {
            successfulResults.push({
              url: resourceUrl,
            });
            // Capture origin ID from the first successful registration
            if (
              !originId &&
              'resource' in value &&
              value.resource?.origin?.id
            ) {
              originId = value.resource.origin.id;
            }
          } else if (
            'success' in value &&
            !value.success &&
            'skipped' in value &&
            value.skipped === true
          ) {
            skippedResults.push({
              url: resourceUrl,
              error: value.error,
              status: 'status' in value ? value.status : undefined,
            });
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

      // Deprecate resources that are no longer in the discovery document
      let deprecated = 0;
      if (originId) {
        const activeResourceUrls = discoveryResult.resources.map(r => r.url);
        deprecated = await deprecateStaleResources(
          originId,
          activeResourceUrls
        );
      }

      return {
        success: true as const,
        registered: successfulResults.length,
        failed: failedResults.length,
        skipped: skippedResults.length,
        deprecated,
        total: results.length,
        source: discoveryResult.source,
        failedDetails: failedResults,
        skippedDetails: skippedResults,
        originId,
      };
    }),

  /**
   * Check discovery for an origin without registering any resources.
   * Returns the list of discovered resource URLs.
   */
  checkDiscovery: publicProcedure
    .input(
      z.object({
        origin: z.url(),
        /** If true, bypasses HTTP cache to get fresh discovery document */
        bustCache: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const discoveryResult = await fetchDiscoveryDocument(
        input.origin,
        input.bustCache ?? false
      );

      if (!discoveryResult.success) {
        return {
          found: false as const,
          error: discoveryResult.error,
        };
      }

      return {
        found: true as const,
        source: discoveryResult.source,
        resourceCount: discoveryResult.resources.length,
        resources: discoveryResult.resources,
        discoveryUrls: discoveryResult.discoveryUrls,
        ownershipProofs: discoveryResult.ownershipProofs,
      };
    }),

  /**
   * Check which URLs are already registered.
   */
  checkRegistered: publicProcedure
    .input(
      z.object({
        urls: z.array(z.string().url()).max(50),
      })
    )
    .query(async ({ input }) => {
      const registered = await scanDb.resources.findMany({
        where: {
          resource: {
            in: input.urls,
          },
        },
        select: {
          resource: true,
        },
      });

      const registeredUrls = new Set(registered.map(r => r.resource));
      return {
        registered: input.urls.filter(url => registeredUrls.has(url)),
        unregistered: input.urls.filter(url => !registeredUrls.has(url)),
      };
    }),

  /**
   * Verify ownership proofs against payTo addresses.
   * Checks if any proof is a valid signature of the origin by any payTo address.
   */
  verifyOwnership: publicProcedure
    .input(
      z.object({
        ownershipProofs: z.array(z.string()),
        origin: z.string(),
        payToAddresses: z.array(z.string()),
      })
    )
    .query(async ({ input }) => {
      const { verifyAnyOwnershipProof } = await import('@/lib/ownership-proof');

      const result = await verifyAnyOwnershipProof(
        input.ownershipProofs,
        input.origin,
        input.payToAddresses
      );

      return result;
    }),

  /**
   * Get verification status for resources or origin.
   * Returns counts of verified vs total accepts.
   */
  verificationStatus: publicProcedure
    .input(
      z.object({
        resourceIds: z.array(z.string().uuid()).optional(),
        originId: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      // Return origin-level verification if originId provided
      if (input.originId) {
        return await getOriginVerificationStatus(input.originId);
      }

      // Return resource-level verification if resourceIds provided
      if (input.resourceIds && input.resourceIds.length > 0) {
        const results = await Promise.all(
          input.resourceIds.map(async id => ({
            resourceId: id,
            ...(await getResourceVerificationStatus(id)),
          }))
        );
        return results;
      }

      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Either resourceIds or originId must be provided',
      });
    }),

  tags: {
    list: publicProcedure
      .input(listTagsSchema.optional())
      .query(async ({ input }) => {
        return await listTags(input ?? { filterTags: [] });
      }),

    getByResource: publicProcedure.input(z.uuid()).query(async ({ input }) => {
      return await listResourceTags(input);
    }),
  },
});
