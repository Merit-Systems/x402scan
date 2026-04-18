import { z } from 'zod';

import { scanDb } from '@x402scan/scan-db';

import { parseX402Response } from '@/lib/x402';
import { mixedAddressSchema, optionalChainSchema } from '@/lib/schemas';

import type { Prisma } from '@x402scan/scan-db';

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
      origin.ogImages.map(async ({ url, height, width, title, description }) => {
        // First, try to find an existing OgImage with this URL for this origin
        const existingOgImage = await tx.ogImage.findFirst({
          where: {
            originId,
            url,
          },
        });

        if (existingOgImage) {
          // Update the existing OgImage
          return tx.ogImage.update({
            where: { id: existingOgImage.id },
            data: {
              height,
              width,
              title,
              description,
            },
          });
        }

        // Try to create a new OgImage
        try {
          return await tx.ogImage.create({
            data: {
              originId,
              url,
              height,
              width,
              title,
              description,
            },
          });
        } catch (error: any) {
          // If we get a unique constraint error on url, it means the URL is already
          // used by another origin. In this case, we'll skip creating this OgImage
          // since the URL metadata is the same regardless of which origin uses it.
          if (error?.code === 'P2002' && error?.meta?.target?.includes('url')) {
            console.warn(
              `OgImage with URL ${url} already exists for a different origin. Skipping.`
            );
            return null;
          }
          throw error;
        }
      })
    );

    return tx.resourceOrigin.findUnique({
      where: { id: originId },
      include: { ogImages: true },
    });
  });
};

export const listOriginsSchema = z.object({
  chain: optionalChainSchema,
  address: mixedAddressSchema.optional(),
});

export const listOrigins = async (input: z.infer<typeof listOriginsSchema>) => {
  const { chain, address } = input;
  const origins = await scanDb.resourceOrigin.findMany({
    where: {
      resources: {
        some: {
          deprecatedAt: null,
          accepts: {
            some: {
              ...(address ? { payTo: address } : {}),
              ...(chain ? { network: chain } : {}),
            },
          },
        },
      },
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
  const acceptsWhere: Prisma.AcceptsWhereInput = {
    ...(address ? { payTo: address } : {}),
    ...(chain ? { network: chain } : {}),
  };
  const origins = await scanDb.resourceOrigin.findMany({
    where: {
      ...(originIds ? { id: { in: originIds } } : {}),
      resources: {
        some: {
          deprecatedAt: null,
          response: {
            isNot: null,
          },
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
          response: {
            isNot: null,
          },
          accepts: {
            some: acceptsWhere,
          },
        },
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
            some: {},
          },
        },
      },
    },
    include: {
      resources: {
        where: {
          deprecatedAt: null,
        },
        include: {
          accepts: {
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
        where: {
          deprecatedAt: null,
        },
        select: {
          tags: {
            select: {
              tag: true,
            },
          },
          accepts: {
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
            where: {
              deprecatedAt: null,
            },
          },
        },
      },
    },
  });
};
