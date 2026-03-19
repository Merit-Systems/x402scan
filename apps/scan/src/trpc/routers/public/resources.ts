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

import { registerResource } from '@/lib/resources';

import { probeX402Endpoint } from '@/lib/discovery/probe';
import { getRegistrationErrorMessage } from '@/lib/discovery/utils';
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
import type { DiscoveryInfo } from '@/types/discovery';
import { verifyAnyOwnershipProof } from '@/lib/ownership-proof';

const BULK_REGISTER_CONCURRENCY = 6;

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
      const probeResult = await probeX402Endpoint(
        input.url.toString().replaceAll('{', '').replaceAll('}', '')
      );

      if (!probeResult.success) {
        return { success: false as const, error: { type: 'no402' as const } };
      }

      const result = await registerResource(
        input.url.toString(),
        probeResult.advisory
      );

      if (result.success === false) {
        return {
          success: false as const,
          data: result.data,
          error: {
            type: 'parseErrors' as const,
            parseErrors:
              result.error.type === 'parseResponse'
                ? result.error.parseErrors
                : [JSON.stringify(result.error)],
          },
        };
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
        methodUsed: probeResult.advisory.method,
        discovery,
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

      const results = await mapSettledWithConcurrency(
        discoveryResult.resources,
        async resource => {
          const resourceUrl = resource.url;

          const probeResult = await probeX402Endpoint(resourceUrl);

          if (!probeResult.success) {
            return {
              success: false as const,
              url: resourceUrl,
              error: probeResult.error,
            };
          }

          const { advisory } = probeResult;

          if (advisory.authMode === 'siwx') {
            return {
              success: false as const,
              skipped: true as const,
              url: resourceUrl,
              error: 'SIWX auth-only endpoint (no payment requirements to index)',
              status: 402,
            };
          }

          if (!advisory.inputSchema) {
            return {
              success: false as const,
              skipped: true as const,
              url: resourceUrl,
              error: 'Missing input schema (non-invocable endpoint skipped in strict mode)',
              status: 402,
            };
          }

          const result = await registerResource(resourceUrl, advisory);

          if (result.success) return result;

          return {
            success: false as const,
            url: resourceUrl,
            error: getRegistrationErrorMessage(result.error),
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
