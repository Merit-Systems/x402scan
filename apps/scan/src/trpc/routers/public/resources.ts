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
            headers: input.headers,
            body: input.body ? JSON.stringify(input.body) : undefined,
          }
        );

        // if it doesn't respond with a 402, return error
        if (response.status !== 402) {
          continue;
        }

        const result = await registerResource(
          input.url.toString(),
          await response.json()
        );

        if (result.success === false) {
          if (result.error.type === 'parseResponse') {
            parseErrorData = {
              data: result.data,
              parseErrors: result.error.parseErrors,
            };
            continue;
          } else {
            return result;
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

      const results = await Promise.allSettled(
        discoveryResult.resources.map(async resource => {
          const resourceUrl = resource.url;
          // Use specified method or try POST then GET
          const methodsToTry = resource.method
            ? [resource.method as Methods]
            : [Methods.POST, Methods.GET];

          for (const method of methodsToTry) {
            try {
              const response = await fetch(resourceUrl, {
                method,
                signal: AbortSignal.timeout(15000),
              });

              if (response.status === 402) {
                return registerResource(resourceUrl, await response.json());
              }
            } catch {
              // Continue to next method
            }
          }
          return { success: false as const, url: resourceUrl, error: 'No 402 response' };
        })
      );

      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value && 'success' in r.value && r.value.success
      ).length;
      const failed = results.length - successful;

      return {
        success: true as const,
        registered: successful,
        failed,
        total: results.length,
        source: discoveryResult.source,
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
      })
    )
    .query(async ({ input }) => {
      const discoveryResult = await fetchDiscoveryDocument(input.origin);

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
      };
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
