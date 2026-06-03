import { scanDb } from '@x402scan/scan-db';

import { getOriginFromUrl } from '@/lib/url';
import { z } from 'zod';
import { toPaginatedResponse } from '@/lib/pagination';

import { supportedChainSchema } from '@/lib/schemas';

import { SUPPORTED_CHAINS } from '@/types/chain';

import { upsertResourceSchema } from './resource-schema';

import type { PaginatedQueryParams } from '@/lib/pagination';
import type { AcceptsNetwork, Prisma } from '@x402scan/scan-db';
import type { SupportedChain } from '@/types/chain';

import {
  createCachedArrayQuery,
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';

export { upsertResourceSchema };

export const upsertResource = async (
  resourceInput: z.input<typeof upsertResourceSchema>
) => {
  const parsedResourceInput = upsertResourceSchema.safeParse(resourceInput);
  if (!parsedResourceInput.success) {
    return;
  }
  const baseResource = parsedResourceInput.data;
  const supportedAccepts = baseResource.accepts.filter(accept =>
    SUPPORTED_CHAINS.includes(accept.network as SupportedChain)
  );
  const unsupportedAccepts = baseResource.accepts.filter(
    accept => !SUPPORTED_CHAINS.includes(accept.network as SupportedChain)
  );
  if (supportedAccepts.length === 0) {
    return;
  }
  const originStr = getOriginFromUrl(baseResource.resource);

  return await scanDb.$transaction(async tx => {
    // Ensure the origin exists inside the transaction to avoid
    // concurrent connectOrCreate race conditions (P2002).
    await tx.resourceOrigin.upsert({
      where: { origin: originStr },
      create: { origin: originStr },
      update: {},
    });

    // Merge new metadata with existing to avoid clobbering fields set by
    // a different registration path (e.g. paid sets pricingMode, siwx sets
    // authMode — both target the same URL-keyed row).
    let mergedMetadata = baseResource.metadata;
    if (baseResource.metadata) {
      const existing = await tx.resources.findUnique({
        where: {
          resource_method: {
            resource: baseResource.resource,
            method: baseResource.method,
          },
        },
        select: { metadata: true },
      });
      if (
        existing?.metadata &&
        typeof existing.metadata === 'object' &&
        !Array.isArray(existing.metadata)
      ) {
        mergedMetadata = { ...existing.metadata, ...baseResource.metadata };
      }
    }

    const { origin, ...resource } = await tx.resources.upsert({
      where: {
        resource_method: {
          resource: baseResource.resource,
          method: baseResource.method,
        },
      },
      create: {
        resource: baseResource.resource,
        method: baseResource.method,
        type: baseResource.type,
        x402Version: baseResource.x402Version,
        lastUpdated: baseResource.lastUpdated,
        metadata: baseResource.metadata,
        origin: {
          connect: {
            origin: originStr,
          },
        },
      },
      update: {
        type: baseResource.type,
        x402Version: baseResource.x402Version,
        lastUpdated: baseResource.lastUpdated,
        metadata: mergedMetadata,
        // Clear deprecatedAt when resource is re-registered (un-deprecate)
        deprecatedAt: null,
        origin: {
          connect: {
            origin: originStr,
          },
        },
      },
      include: {
        origin: true,
      },
    });

    const accepts = await Promise.all(
      supportedAccepts.map(async baseAccepts =>
        tx.accepts.upsert({
          where: {
            resourceId_scheme_network: {
              resourceId: resource.id,
              scheme: baseAccepts.scheme,
              network: baseAccepts.network as AcceptsNetwork,
            },
          },
          create: {
            resourceId: resource.id,
            scheme: baseAccepts.scheme,
            description: baseAccepts.description,
            network: baseAccepts.network as AcceptsNetwork,
            maxAmountRequired: BigInt(baseAccepts.maxAmountRequired),
            resource: resource.resource,
            mimeType: baseAccepts.mimeType,
            payTo: baseAccepts.payTo,
            maxTimeoutSeconds: baseAccepts.maxTimeoutSeconds,
            asset: baseAccepts.asset,
            outputSchema: baseAccepts.outputSchema,
            extra: baseAccepts.extra,
          },
          update: {
            description: baseAccepts.description,
            maxAmountRequired: BigInt(baseAccepts.maxAmountRequired),
            mimeType: baseAccepts.mimeType,
            payTo: baseAccepts.payTo,
            maxTimeoutSeconds: baseAccepts.maxTimeoutSeconds,
            asset: baseAccepts.asset,
            outputSchema: baseAccepts.outputSchema,
            extra: baseAccepts.extra,
            // Clear verification when payTo or other critical fields change
            verified: false,
            verifiedAddress: null,
            verificationProof: null,
            verifiedAt: null,
          },
        })
      )
    );

    return {
      resource,
      accepts,
      origin,
      unsupportedAccepts,
    };
  });
};

export const getResource = async (id: string) => {
  return await scanDb.resources.findUnique({
    where: {
      id,
    },
    include: {
      origin: true,
      accepts: {
        select: {
          id: true,
          description: true,
          network: true,
          payTo: true,
          maxAmountRequired: true,
          mimeType: true,
          asset: true,
        },
      },
    },
  });
};

export const listResourcesUncached = async (
  where?: Prisma.ResourcesWhereInput
) => {
  return await scanDb.resources.findMany({
    where: {
      ...where,
      // Exclude deprecated resources by default
      deprecatedAt: null,
    },
    orderBy: [
      { invocations: { _count: 'desc' } },
      { tags: { _count: 'desc' } },
    ],
  });
};

export const listResources = createCachedArrayQuery({
  queryFn: listResourcesUncached,
  cacheKeyPrefix: 'resources:list',
  createCacheKey: where => createStandardCacheKey({ where }),
  dateFields: [],
  tags: ['resources'],
});

export type ResourceSortId = 'lastUpdated' | 'toolCalls';

interface ResourceSorting {
  id: ResourceSortId;
  desc: boolean;
}

export const listResourcesWithPaginationUncached = async (
  input: {
    where?: Prisma.ResourcesWhereInput;
    sorting?: ResourceSorting;
    includeDeprecated?: boolean;
  },
  pagination: PaginatedQueryParams
) => {
  const { where, sorting, includeDeprecated } = input;
  const { page, page_size } = pagination;

  // Default sorting
  const sortConfig = sorting ?? { id: 'toolCalls', desc: true };

  // Map sorting to Prisma orderBy
  const orderBy: Prisma.ResourcesOrderByWithRelationInput =
    sortConfig.id === 'lastUpdated'
      ? { lastUpdated: sortConfig.desc ? 'desc' : 'asc' }
      : { toolCalls: { _count: sortConfig.desc ? 'desc' : 'asc' } };

  // Exclude deprecated resources by default
  const whereWithDeprecation: Prisma.ResourcesWhereInput = {
    ...where,
    ...(includeDeprecated ? {} : { deprecatedAt: null }),
  };

  const [count, resources] = await Promise.all([
    scanDb.resources.count({
      where: whereWithDeprecation,
    }),
    scanDb.resources.findMany({
      where: whereWithDeprecation,
      include: {
        accepts: true,
        origin: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            tags: true,
            toolCalls: true,
          },
        },
      },
      orderBy,
      skip: page * page_size,
      take: page_size + 1,
    }),
  ]);

  return toPaginatedResponse({
    items: resources,
    total_count: count,
    ...pagination,
  });
};

export const listResourcesWithPagination = createCachedPaginatedQuery({
  queryFn: listResourcesWithPaginationUncached,
  cacheKeyPrefix: 'resources:list-paginated',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: [],
  tags: ['resources'],
});

export const getResourceByAddress = async (address: string) => {
  return await scanDb.resources.findFirst({
    where: {
      deprecatedAt: null,
      accepts: {
        some: {
          payTo: address.toLowerCase(),
        },
      },
    },
  });
};

export const searchResourcesSchema = z.object({
  search: z.string().optional(),
  limit: z.number().optional().default(10),
  tagIds: z.array(z.string()).optional(),
  resourceIds: z.array(z.string()).optional(),
  showExcluded: z.boolean().optional().default(false),
  showDeprecated: z.boolean().optional().default(false),
  chains: z.array(supportedChainSchema).optional(),
});

const searchResourcesUncached = async (
  input: z.infer<typeof searchResourcesSchema>
) => {
  const {
    search,
    limit,
    tagIds,
    resourceIds,
    showExcluded,
    showDeprecated,
    chains,
  } = input;
  const acceptsFilter: Prisma.AcceptsWhereInput =
    chains !== undefined ? { network: { in: chains } } : {};
  return await scanDb.resources.findMany({
    where: {
      // Include paid resources (with accepts) and SIWX (free) resources.
      // When filtering by chain, SIWX resources are excluded since they
      // have no chain-specific payment options.
      ...(chains !== undefined
        ? { accepts: { some: acceptsFilter } }
        : {
            OR: [
              { accepts: { some: {} } },
              { metadata: { path: ['authMode'], equals: 'siwx' } },
            ],
          }),
      ...(search
        ? {
            OR: [
              {
                resource: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                origin: {
                  resources: {
                    some: {
                      accepts: {
                        some: {
                          payTo: search.toLowerCase(),
                        },
                      },
                    },
                  },
                },
              },
              {
                metadata: {
                  path: ['title', 'description'],
                  string_contains: search,
                },
              },
            ],
          }
        : undefined),
      ...(tagIds ? { tags: { some: { tagId: { in: tagIds } } } } : undefined),
      ...(resourceIds ? { id: { in: resourceIds } } : undefined),
      ...(!showExcluded ? { excluded: { is: null } } : {}),
      ...(!showDeprecated ? { deprecatedAt: null } : {}),
    },
    include: {
      origin: true,
      accepts: {
        where: {
          payTo: {
            not: '',
          },
        },
      },
      _count: {
        select: {
          toolCalls: true,
        },
      },
    },
    take: limit,
    orderBy: [{ toolCalls: { _count: 'desc' } }, { tags: { _count: 'desc' } }],
  });
};

export const searchResources = createCachedArrayQuery({
  queryFn: searchResourcesUncached,
  cacheKeyPrefix: 'resources:search',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: [],
  tags: ['resources'],
});

export const listResourcesForTools = async (resourceIds: string[]) => {
  return await scanDb.resources.findMany({
    where: {
      id: { in: resourceIds },
      excluded: { is: null },
      deprecatedAt: null,
    },
    include: {
      accepts: true,
      requestMetadata: true,
    },
  });
};

/**
 * Deprecate resources that are no longer in the discovery document.
 * Sets deprecatedAt to now() for resources not in the provided URLs list.
 *
 * Safety checks:
 * - If activeResourceUrls is empty, no deprecation occurs (discovery failure).
 * - If ALL active resources would be deprecated, no deprecation occurs (likely
 *   a URL normalization mismatch rather than a legitimate removal of every endpoint).
 */
export const deprecateStaleResources = async (
  originId: string,
  activeResources: { url: string; method: string }[]
) => {
  if (activeResources.length === 0) {
    return 0;
  }

  // Fetch all non-deprecated resources for this origin with a simple indexed query.
  // Compare in application code to find stale ones — avoids complex Prisma NOT/OR
  // patterns that may generate unexpected SQL.
  const allResources = await scanDb.resources.findMany({
    where: { originId, deprecatedAt: null },
    select: { id: true, resource: true, method: true },
  });

  if (allResources.length === 0) {
    return 0;
  }

  const activeKeys = new Set(
    activeResources.map(r => `${r.method}::${r.url}`)
  );
  const staleIds = allResources
    .filter(r => !activeKeys.has(`${r.method}::${r.resource}`))
    .map(r => r.id);

  if (staleIds.length === 0) {
    return 0;
  }

  // Safety: if we'd deprecate everything, it's almost certainly a bug
  // (URL normalization mismatch), not the origin removing all endpoints.
  if (staleIds.length === allResources.length) {
    console.warn(
      `[deprecateStaleResources] Skipping: would deprecate all ${allResources.length} active resources for origin ${originId}. Likely a URL normalization mismatch.`
    );
    return 0;
  }

  const result = await scanDb.resources.updateMany({
    where: { id: { in: staleIds } },
    data: { deprecatedAt: new Date() },
  });

  return result.count;
};
