import { z } from "zod";

import { AcceptsNetwork, scanDb } from "@x402scan/scan-db";

import { parseX402Response } from "@/lib/x402";
import { mixedAddressSchema, optionalChainSchema } from "@/lib/schemas";
import { FREE_AUTH_MODES, isFreeResource } from "@/lib/resource-auth";

import type { Prisma } from "@x402scan/scan-db";
import type { MixedAddress } from "@/types/address";

/** OR-able filters matching free resources (siwx/unprotected/apiKey). */
export const freeAuthModeFilters: Prisma.ResourcesWhereInput[] =
  FREE_AUTH_MODES.map((mode) => ({
    metadata: { path: ["authMode"], equals: mode },
  }));

const SUPPORTED_ACCEPT_NETWORKS = [
  AcceptsNetwork.base,
  AcceptsNetwork.solana,
] satisfies AcceptsNetwork[];

function getDisplayableAcceptsWhere({
  chain,
  address,
}: {
  chain?: z.infer<typeof optionalChainSchema>;
  address?: z.infer<typeof mixedAddressSchema>;
}): Prisma.AcceptsWhereInput {
  return {
    payTo: address,
    ...(chain
      ? { network: chain }
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
    // Free resources (siwx/public/apiKey): identified by metadata.authMode
    ...freeAuthModeFilters,
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
  email: z.email().optional(),
  ogImages: z.array(ogImageSchema),
});

/**
 * Atomic origin ensure-exists. Uses raw INSERT ON CONFLICT so it's immune to
 * the SELECT→INSERT P2002 race that Prisma's upsert suffers inside concurrent
 * transactions.
 */
export async function ensureOriginExists(
  tx: Prisma.TransactionClient,
  origin: string
) {
  await tx.$executeRaw`
    INSERT INTO "ResourceOrigin" ("id", "origin", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${origin}, now(), now())
    ON CONFLICT ("origin") DO NOTHING
  `;
}

export const upsertOrigin = async (
  originInput: z.input<typeof originSchema>
) => {
  const origin = originSchema.parse(originInput);
  return scanDb.$transaction(async (tx) => {
    const upsertedOrigin = await tx.resourceOrigin.upsert({
      where: { origin: origin.origin },
      update: {
        title: origin.title,
        description: origin.description,
        favicon: origin.favicon,
        ...(origin.email && { email: origin.email }),
      },
      create: {
        origin: origin.origin,
        title: origin.title,
        description: origin.description,
        favicon: origin.favicon,
        email: origin.email,
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

  const { _count: count } = existingOrigin ?? {};
  return count?.resources ?? 0;
};

export const listOriginsSchema = z.object({
  chain: optionalChainSchema,
  address: mixedAddressSchema.optional(),
});

export const listOrigins = async (input: z.infer<typeof listOriginsSchema>) => {
  const { chain, address } = input;
  const acceptsWhere = getDisplayableAcceptsWhere({ chain, address });
  // Free resources have no chain/address — only include them when
  // no chain or address filter is applied.
  const hasPaymentFilter = chain != null || address != null;
  const resourceFilter: Prisma.ResourcesWhereInput = hasPaymentFilter
    ? { deprecatedAt: null, accepts: { some: acceptsWhere } }
    : {
        deprecatedAt: null,
        OR: [{ accepts: { some: acceptsWhere } }, ...freeAuthModeFilters],
      };
  const origins = await scanDb.resourceOrigin.findMany({
    where: {
      resources: { some: resourceFilter },
    },
    orderBy: { createdAt: "desc" },
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
  // Free resources have no chain/address — only include them when
  // no chain or address filter is applied.
  const hasPaymentFilter = chain != null || address != null;
  const paidOrFreeResource: Prisma.ResourcesWhereInput = hasPaymentFilter
    ? {
        deprecatedAt: null,
        response: { isNot: null },
        accepts: { some: acceptsWhere },
      }
    : {
        deprecatedAt: null,
        OR: [
          { response: { isNot: null }, accepts: { some: acceptsWhere } },
          ...freeAuthModeFilters,
        ],
      };
  const origins = await scanDb.resourceOrigin.findMany({
    where: {
      id: originIds ? { in: originIds } : undefined,
      resources: { some: paidOrFreeResource },
    },
    include: {
      resources: {
        where: paidOrFreeResource,
        orderBy: {
          resource: "asc",
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
        _count: "desc",
      },
    },
  });
  return origins
    .map((origin) => ({
      ...origin,
      resources: origin.resources.map((resource) => {
        // Free resources (siwx/public/apiKey) have no 402 response — treat
        // them as successful with empty payment data. The !response guard
        // defends against stale free markers on rows that later stored a
        // 402 response.
        if (isFreeResource(resource) && !resource.response) {
          return {
            ...resource,
            success: true as const,
            data: undefined,
          };
        }
        const response = parseX402Response(resource.response?.response);
        if (!response.success) {
          console.error(
            `[listOriginsWithResources] parseX402Response failed for resource ${resource.id} (${resource.resource}):`,
            JSON.stringify(response.errors),
            "raw response:",
            JSON.stringify(resource.response?.response)
          );
        }
        return {
          ...resource,
          ...response,
        };
      }),
    }))
    .filter((origin) => origin.resources.length > 0);
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
  return scanDb.resourceOrigin.findMany({
    where: {
      origin: {
        contains: search,
        mode: "insensitive",
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

// Normalized through mixedAddressSchema (lowercases EVM addresses to match the
// transfers MVs) and sorted for stable downstream cache keys
export const getOriginPayToAddresses = async (
  id: string
): Promise<MixedAddress[]> => {
  const origin = await scanDb.resourceOrigin.findUnique({
    where: { id },
    select: {
      resources: {
        where: displayableResourceWhere,
        select: {
          accepts: {
            where: getDisplayableAcceptsWhere({}),
            select: {
              payTo: true,
            },
          },
        },
      },
    },
  });

  if (!origin) return [];

  const addresses = origin.resources
    .flatMap((resource) => resource.accepts.map((accept) => accept.payTo))
    .map((payTo) => mixedAddressSchema.safeParse(payTo))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data);

  return [...new Set(addresses)].toSorted((a, b) => a.localeCompare(b));
};
