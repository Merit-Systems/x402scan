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

import { registerEndpoint } from '@/lib/discovery/register-endpoint';
import { registerResourcesFromDiscovery } from '@/lib/discovery/register-origin';
import { TRPCError } from '@trpc/server';
import {
  listResourceTags,
  listTags,
  listTagsSchema,
} from '@/services/db/resources/tag';

import { convertTokenAmount } from '@/lib/token';
import { usdc } from '@/lib/tokens/usdc';
import { fetchDiscoveryDocument } from '@/services/discovery';
import {
  getResourceVerificationStatus,
  getOriginVerificationStatus,
} from '@/services/verification/accepts-verification';

import type { Prisma } from '@x402scan/scan-db';
import type { SupportedChain } from '@/types/chain';
import { verifyAnyOwnershipProof } from '@/lib/ownership-proof';

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
      return await registerEndpoint(input.url.toString());
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

      const result = await registerResourcesFromDiscovery(
        discoveryResult.resources,
        discoveryResult.source,
        discoveryResult.info
      );

      if (result.registered === 0 && result.siwx === 0) {
        return {
          success: false as const,
          error: {
            type: 'noValidResources' as const,
            message:
              'No valid x402 or free (SIWX) resources were found for this origin. Add at least one resource that passes validation to complete registration.',
          },
          result,
        };
      }

      return { success: true as const, ...result };
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
