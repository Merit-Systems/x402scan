import { z } from 'zod';

import { prisma } from '../client';

import { parseX402Response } from '@/lib/x402/schema';
import { mixedAddressSchema, optionalChainSchema } from '@/lib/schemas';

import type { Prisma } from '@prisma/client';

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

export const listOriginsSchema = z.object({
  chain: optionalChainSchema,
  address: mixedAddressSchema.optional(),
});

export const listOrigins = async (input: z.infer<typeof listOriginsSchema>) => {
  const { chain, address } = input;
  const origins = await prisma.resourceOrigin.findMany({
    where: {
      resources: {
        some: {
          accepts: {
            some: {
              ...(address ? { payTo: address } : {}),
              ...(chain ? { network: chain } : {}),
            },
          },
        },
      },
    },
  });
  return origins;
};

export const listOriginsWithResourcesSchema = z.object({
  chain: optionalChainSchema,
  address: mixedAddressSchema.optional(),
});

export const listOriginsWithResources = async (
  input: z.infer<typeof listOriginsWithResourcesSchema>
) => {
  const { chain, address } = input;
  const acceptsWhere: Prisma.AcceptsWhereInput = {
    ...(address ? { payTo: address } : {}),
    ...(chain ? { network: chain } : {}),
  };
  const origins = await prisma.resourceOrigin.findMany({
    where: {
      resources: {
        some: {
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
          response: {
            isNot: null,
          },
          accepts: {
            some: acceptsWhere,
          },
        },
        include: {
          accepts: {
            where: acceptsWhere,
          },
          response: true,
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
