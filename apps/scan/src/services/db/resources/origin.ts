import { z } from 'zod';

import { scanDb } from '@x402scan/scan-db';

import { parseX402Response, type ParsedX402Response } from '@/lib/x402';
import { mixedAddressSchema, optionalChainSchema } from '@/lib/schemas';
import { SUPPORTED_CHAINS } from '@/types/chain';

import type { AcceptsNetwork, Prisma, Resources } from '@x402scan/scan-db';

function isSiwxResource(resource: Pick<Resources, 'metadata'>): boolean {
  return (
    resource.metadata != null &&
    typeof resource.metadata === 'object' &&
    'authMode' in resource.metadata &&
    resource.metadata.authMode === 'siwx'
  );
}

const SUPPORTED_ACCEPT_NETWORKS = SUPPORTED_CHAINS.map(
  chain => chain as AcceptsNetwork
);

function getDisplayableAcceptsWhere({
  chain,
  address,
}: {
  chain?: z.infer<typeof optionalChainSchema>;
  address?: z.infer<typeof mixedAddressSchema>;
}): Prisma.AcceptsWhereInput {
  return {
    ...(address ? { payTo: address } : {}),
    ...(chain
      ? { network: chain as AcceptsNetwork }
      : { network: { in: SUPPORTED_ACCEPT_NETWORKS } }),
  };
}

const displayableResourceWhere: Prisma.ResourcesWhereInput = {
  deprecatedAt: null,
  OR: [
    // Paid resources: must have a stored 402 response and supported accepts
    {
      response: { isNot: null },
      accepts: { some: getDisplayableAcceptsWhere({}) },
    },
    // SIWX (free) resources: identified by metadata.authMode
    {
      metadata: { path: ['authMode'], equals: 'siwx' },
    },
  ],
};

const ogImageSchema = z.object({
  url: z.url(),
  height: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

const originSchema = z.object({
  origin: z.url(),
  title: z.string().optional(),
  description: z.string().optional(),
  favicon: z.url().optional(),
  ogImages: z.array(ogImageSchema),
});

export const upsertOrigin = async (
  originInput: z.input<typeof originSchema>
) => {
  const origin = originSchema.parse(originInput);
  return await scanDb.$transaction(async tx => {
    const upsertedOrigin = await tx.resourceOrigin.upsert({
      where: { origin: origin.origin },
      update: {
        title: origin.title,
        description: origin.description,
        favicon: origin.favicon,
      },
      create: {
        origin: origin.origin,
        title: origin.title,
        description: origin.description,
        favicon: origin.favicon,
      },
    });

    const originId = upsertedOrigin.id;

    await Promise.all(
      origin.ogImages.map(({ url, height, width, title, description }) =>
        tx.ogImage.upsert({
          where: {
            originId_url: {
              originId,
              url,
            },
          },
          update: {
            height,
            width,
            title,
            description,
          },
          create: {
            originId,
            url,
            height,
            width,
            title,
            description,
          },
        })
      )
    );

    return tx.resourceOrigin.findUnique({
      where: { id: originId },
      include: { ogImages: true },
    });
  });
};

export const getOriginResourceCount = async (origin: string) => {
  const existingOrigin = await scanDb.resourceOrigin.findUnique({
    where: { origin },
    select: {
      _count: {
        select: {
          resources: { where: { deprecatedAt: null } },
        },
      },
    },
  });

  return existingOrigin?._count.resources ?? 0;
};

export const listOriginsSchema = z.object({
  chain: optionalChainSchema,
  address: mixedAddressSchema.optional(),
});

export const listOrigins = async (input: z.infer<typeof listOriginsSchema>) => {
  const { chain, address } = input;
  const acceptsWhere = getDisplayableAcceptsWhere({ chain, address });
  // SIWX (free) resources have no chain/address — only include them when
  // no chain or address filter is applied.
  const hasPaymentFilter = chain != null || address != null;
  const resourceFilter: Prisma.ResourcesWhereInput = hasPaymentFilter
    ? { deprecatedAt: null, accepts: { some: acceptsWhere } }
    : {
        deprecatedAt: null,
        OR: [
          { accepts: { some: acceptsWhere } },
          { metadata: { path: ['authMode'], equals: 'siwx' } },
        ],
      };
  const origins = await scanDb.resourceOrigin.findMany({
    where: {
      resources: { some: resourceFilter },
    },
    orderBy: { createdAt: 'desc' },
  });
  return origins;
};

export const listOriginsWithResourcesSchema = z.object({
  chain: optionalChainSchema,
  address: mixedAddressSchema.optional(),
  originIds: z.array(z.uuid()).optional(),
});

export const listOriginsWithResources = async (
  input: z.infer<typeof listOriginsWithResourcesSchema>
) => {
  const { chain, address, originIds } = input;
  const acceptsWhere = getDisplayableAcceptsWhere({ chain, address });
  // SIWX (free) resources have no chain/address — only include them when
  // no chain or address filter is applied.
  const hasPaymentFilter = chain != null || address != null;
  const paidOrSiwxResource: Prisma.ResourcesWhereInput = hasPaymentFilter
    ? {
        deprecatedAt: null,
        response: { isNot: null },
        accepts: { some: acceptsWhere },
      }
    : {
        deprecatedAt: null,
        OR: [
          { response: { isNot: null }, accepts: { some: acceptsWhere } },
          { metadata: { path: ['authMode'], equals: 'siwx' } },
        ],
      };
  const origins = await scanDb.resourceOrigin.findMany({
    where: {
      ...(originIds ? { id: { in: originIds } } : {}),
      resources: { some: paidOrSiwxResource },
    },
    include: {
      resources: {
        where: paidOrSiwxResource,
        orderBy: {
          resource: 'asc',
        },
        include: {
          accepts: {
            where: acceptsWhere,
          },
          response: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      },
      ogImages: true,
    },
    orderBy: {
      resources: {
        _count: 'desc',
      },
    },
  });
  return origins
    .map(origin => ({
      ...origin,
      resources: origin.resources.map(resource => {
        // SIWX (free) resources have no 402 response — they're identity-gated,
        // not paid. Treat them as successful with empty payment data.
        if (isSiwxResource(resource)) {
          return {
            ...resource,
            success: true as const,
            data: {} as ParsedX402Response,
          };
        }
        const response = parseX402Response(resource.response?.response);
        if (!response.success) {
          console.error(
            `[listOriginsWithResources] parseX402Response failed for resource ${resource.id} (${resource.resource}):`,
            JSON.stringify(response.errors),
            'raw response:',
            JSON.stringify(resource.response?.response)
          );
        }
        return {
          ...resource,
          ...response,
        };
      }),
    }))
    .filter(origin => origin.resources.length > 0);
};

export const searchOriginsSchema = z.object({
  search: z.string(),
  limit: z.number().optional().default(10),
});

export const searchOrigins = async (
  input: z.input<typeof searchOriginsSchema>
) => {
  const { search, limit } = searchOriginsSchema.parse(input);
  const acceptsWhere = getDisplayableAcceptsWhere({});
  return await scanDb.resourceOrigin.findMany({
    where: {
      origin: {
        contains: search,
        mode: 'insensitive',
      },
      resources: {
        some: {
          deprecatedAt: null,
          accepts: {
            some: acceptsWhere,
          },
        },
      },
    },
    include: {
      resources: {
        where: {
          deprecatedAt: null,
          accepts: {
            some: acceptsWhere,
          },
        },
        include: {
          accepts: {
            where: acceptsWhere,
            select: {
              payTo: true,
            },
          },
        },
      },
    },
    take: limit,
  });
};

export const getOrigin = async (id: string) => {
  const origin = await scanDb.resourceOrigin.findUnique({
    where: { id },
    include: {
      ogImages: true,
      resources: {
        where: { x402Version: 2 },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!origin) return null;

  const { resources, ...originData } = origin;

  return {
    ...originData,
    hasX402V2Resource: resources.length > 0,
  };
};

export const getOriginMetadata = async (id: string) => {
  return await scanDb.resourceOrigin.findUnique({
    where: { id },
    select: {
      resources: {
        where: displayableResourceWhere,
        select: {
          tags: {
            select: {
              tag: true,
            },
          },
          accepts: {
            where: getDisplayableAcceptsWhere({}),
            select: {
              payTo: true,
            },
          },
          _count: {
            select: {
              agentConfigurationResources: true,
            },
          },
        },
      },
      _count: {
        select: {
          resources: {
            where: displayableResourceWhere,
          },
        },
      },
    },
  });
};
