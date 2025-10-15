import type { Prisma } from '@prisma/client';
import { prisma } from './client';

import { z } from 'zod';
import { parseX402Response } from '@/lib/x402/schema';

const ogImageSchema = z.object({
  url: z.url(),
  height: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

export const originSchema = z.object({
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
  return await prisma.resourceOrigin.upsert({
    where: { origin: origin.origin },
    update: {
      title: origin.title,
      description: origin.description,
      favicon: origin.favicon,
      ogImages: {
        upsert: origin.ogImages.map(
          ({ url, height, width, title, description }) => ({
            where: {
              url,
            },
            create: {
              url,
              height,
              width,
              title,
              description,
            },
            update: {
              height,
              width,
              title,
              description,
            },
          })
        ),
      },
    },
    create: {
      origin: origin.origin,
      title: origin.title,
      description: origin.description,
      favicon: origin.favicon,
      ogImages: {
        create: origin.ogImages.map(
          ({ url, height, width, title, description }) => ({
            url,
            height,
            width,
            title,
            description,
          })
        ),
      },
    },
  });
};

const listOriginsByAddressWhere = (
  address: string
): Prisma.ResourceOriginWhereInput => {
  return {
    resources: {
      some: {
        accepts: {
          some: {
            payTo: address.toLowerCase(),
          },
        },
      },
    },
  };
};

export const listOriginsByAddress = async (address: string) => {
  return await prisma.resourceOrigin.findMany({
    where: listOriginsByAddressWhere(address),
  });
};

export const listOriginsWithResources = async () => {
  const origins = await listOriginsWithResourcesInternal({
    resources: {
      some: {
        response: {
          isNot: null,
        },
      },
    },
  });
  return origins
    .map(origin => ({
      ...origin,
      resources: origin.resources
        .map(resource => {
          const response = parseX402Response(resource.response?.response);
          return {
            ...resource,
            ...response,
          };
        })
        .filter(response => response.success),
    }))
    .filter(origin => origin.resources.length > 0);
};

export const listOriginsWithResourcesByAddress = async (address: string) => {
  const origins = await listOriginsWithResourcesInternal(
    listOriginsByAddressWhere(address)
  );
  return origins
    .map(origin => ({
      ...origin,
      resources: origin.resources
        .map(resource => {
          const response = parseX402Response(resource.response?.response);
          return {
            ...resource,
            ...response,
          };
        })
        .filter(response => response.success === true),
    }))
    .filter(origin => origin.resources.length > 0);
};

const listOriginsWithResourcesInternal = async (
  where?: Prisma.ResourceOriginWhereInput
) => {
  return await prisma.resourceOrigin.findMany({
    where,
    include: {
      resources: {
        include: {
          accepts: true,
          response: true,
        },
        where: {
          response: {
            isNot: null,
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
};

export const searchOriginsSchema = z.object({
  search: z.string(),
  limit: z.number().optional().default(10),
});

export const searchOrigins = async (
  input: z.input<typeof searchOriginsSchema>
) => {
  const { search, limit } = searchOriginsSchema.parse(input);
  return await prisma.resourceOrigin.findMany({
    where: {
      origin: {
        contains: search,
      },
    },
    include: {
      resources: {
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
