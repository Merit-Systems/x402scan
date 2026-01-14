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
import { getOriginFromUrl } from '@/lib/url';
import { fetchDiscoveryDocument } from '@/services/discovery';
import {
  getResourceVerificationStatus,
  getOriginVerificationStatus,
} from '@/services/verification/accepts-verification';

import type { Prisma } from '@x402scan/scan-db';
import type { SupportedChain } from '@/types/chain';
import type { DiscoveryInfo } from '@/types/discovery';

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
        })
      )
      .query(async ({ input, ctx: { pagination } }) => {
        return await listResourcesWithPagination(
          { where: input.where, sorting: input.sorting },
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
                ? { ...input.headers, 'Content-Type': 'application/json' }
                : input.headers,
            body: input.body
              ? JSON.stringify(input.body)
              : method === Methods.POST
                ? '{}'
                : undefined,
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
          if (discoveryResult.success) {
            // Filter out the URL that was just registered
            const otherResources = discoveryResult.resources.filter(
              r => r.url !== input.url
            );
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

      const results = await Promise.allSettled(
        discoveryResult.resources.map(async resource => {
          const resourceUrl = resource.url;
          // Always try both POST and GET to find which method works
          const methodsToTry = [Methods.POST, Methods.GET];

          let lastError = 'No 402 response';
          let lastStatus: number | undefined;
          const errors: string[] = [];

          for (const method of methodsToTry) {
            try {
              const response = await fetch(resourceUrl, {
                method,
                headers:
                  method === Methods.POST
                    ? { 'Content-Type': 'application/json' }
                    : {},
                body: method === Methods.POST ? '{}' : undefined,
                signal: AbortSignal.timeout(15000),
              });

              lastStatus = response.status;

              if (response.status === 402) {
                // Extract x402 data (handles v2 header and v1 body, with JSON parse fallback)
                const x402Data = await extractX402Data(response);
                const result = await registerResource(resourceUrl, x402Data);

                // If registration succeeded, return it
                if (result.success) {
                  return result;
                }

                // Registration failed, capture error but continue trying other methods
                const errorMsg =
                  getErrorMessage(result.error) || 'Registration failed';
                errors.push(`${method}: ${errorMsg}`);
                lastError = errors.join('; ');
                // Continue to try next method - don't break
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
          }

          return {
            success: false as const,
            url: resourceUrl,
            error: lastError,
            status: lastStatus,
          };
        })
      );

      // Separate successful and failed results with details
      const successfulResults: { url: string }[] = [];
      const failedResults: { url: string; error: string; status?: number }[] =
        [];

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

      return {
        success: true as const,
        registered: successfulResults.length,
        failed: failedResults.length,
        total: results.length,
        source: discoveryResult.source,
        failedDetails: failedResults,
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
