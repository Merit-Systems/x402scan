import { prisma } from './client';

import { getOriginFromUrl } from '@/lib/url';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { ethereumAddressSchema } from '@/lib/schemas';
import type { EnhancedOutputSchema } from '@/lib/x402/schema';
import { toPaginatedResponse } from '@/lib/pagination';
import type { paginatedQuerySchema } from '@/lib/pagination';

export const upsertResourceSchema = z.object({
  resource: z.string(),
  type: z.enum(['http']),
  x402Version: z.number(),
  lastUpdated: z.coerce.date(),
  metadata: z.record(z.string(), z.any()).optional(),
  accepts: z.array(
    z.object({
      scheme: z.enum(['exact']),
      network: z.enum([
        'base_sepolia',
        'avalanche_fuji',
        'base',
        'sei',
        'sei_testnet',
        'avalanche',
        'iotex',
        'solana_devnet',
        'solana',
      ]),
      payTo: ethereumAddressSchema,
      description: z.string(),
      maxAmountRequired: z.string(),
      mimeType: z.string(),
      maxTimeoutSeconds: z.number(),
      asset: z.string(),
      outputSchema: z.custom<EnhancedOutputSchema>().optional(),
      extra: z.record(z.string(), z.any()).optional(),
    })
  ),
});

export const upsertResource = async (
  resourceInput: z.input<typeof upsertResourceSchema>
) => {
  const baseResource = upsertResourceSchema.parse(resourceInput);
  const baseAccepts = baseResource.accepts.find(
    accept => accept.network === 'base'
  );
  const originStr = getOriginFromUrl(baseResource.resource);
  if (!baseAccepts) return;
  return await prisma.$transaction(async tx => {
    const { origin, ...resource } = await tx.resources.upsert({
      where: {
        resource: baseResource.resource,
      },
      create: {
        resource: baseResource.resource,
        type: baseResource.type,
        x402Version: baseResource.x402Version,
        lastUpdated: baseResource.lastUpdated,
        metadata: baseResource.metadata,
        origin: {
          connectOrCreate: {
            where: {
              origin: originStr,
            },
            create: {
              origin: originStr,
            },
          },
        },
      },
      update: {
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
      include: {
        origin: true,
      },
    });

    const accepts = await tx.accepts.upsert({
      where: {
        resourceId_scheme_network: {
          resourceId: resource.id,
          scheme: baseAccepts.scheme,
          network: 'base',
        },
        payTo: baseAccepts.payTo.toLowerCase(),
      },
      create: {
        resourceId: resource.id,
        scheme: baseAccepts.scheme,
        description: baseAccepts.description,
        network: 'base',
        maxAmountRequired: BigInt(baseAccepts.maxAmountRequired),
        resource: resource.resource,
        mimeType: baseAccepts.mimeType,
        payTo: baseAccepts.payTo.toLowerCase(),
        maxTimeoutSeconds: baseAccepts.maxTimeoutSeconds,
        asset: baseAccepts.asset,
        outputSchema: baseAccepts.outputSchema,
        extra: baseAccepts.extra,
      },
      update: {
        description: baseAccepts.description,
        maxAmountRequired: BigInt(baseAccepts.maxAmountRequired),
        mimeType: baseAccepts.mimeType,
        payTo: baseAccepts.payTo.toLowerCase(),
        maxTimeoutSeconds: baseAccepts.maxTimeoutSeconds,
        asset: baseAccepts.asset,
        outputSchema: baseAccepts.outputSchema,
        extra: baseAccepts.extra,
      },
    });

    return {
      resource,
      accepts,
      origin,
    };
  });
};

export const getResource = async (id: string) => {
  return await prisma.resources.findUnique({
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

export const listResources = async (where?: Prisma.ResourcesWhereInput) => {
  return await prisma.resources.findMany({
    where,
    orderBy: [
      { invocations: { _count: 'desc' } },
      { tags: { _count: 'desc' } },
    ],
  });
};

export const listResourcesWithPagination = async (
  pagination: z.infer<ReturnType<typeof paginatedQuerySchema>>,
  where?: Prisma.ResourcesWhereInput
) => {
  const { skip, limit } = pagination;
  const resources = await prisma.resources.findMany({
    where,
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
          invocations: true,
        },
      },
    },
    orderBy: {
      invocations: {
        _count: 'desc',
      },
    },
    skip,
    take: limit + 1,
  });

  return toPaginatedResponse({ items: resources, limit });
};

export const getResourceByAddress = async (address: string) => {
  return await prisma.resources.findFirst({
    where: {
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
});

export const searchResources = async (
  input: z.input<typeof searchResourcesSchema>
) => {
  const { search, limit, tagIds } = searchResourcesSchema.parse(input);
  console.log(search, limit, tagIds);
  return await prisma.resources.findMany({
    where: {
      ...(search
        ? {
            OR: [
              {
                resource: {
                  contains: search,
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
    },
    include: {
      origin: true,
      accepts: true,
      _count: {
        select: {
          invocations: true,
        },
      },
    },
    take: limit,
    orderBy: [
      { invocations: { _count: 'desc' } },
      { tags: { _count: 'desc' } },
    ],
  });
};

export const listResourcesForTools = async (resourceIds: string[]) => {
  return await prisma.resources.findMany({
    where: {
      id: { in: resourceIds },
    },
    include: {
      accepts: true,
      requestMetadata: true,
    },
  });
};
