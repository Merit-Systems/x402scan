import { scanDb } from '@x402scan/scan-db';

import { mixedAddressSchema } from '@/lib/schemas';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';

import type { Chain } from '@/types/chain';
import type { AcceptsNetwork, ResourceOrigin } from '@x402scan/scan-db';

interface GetAcceptsAddressesInput {
  chain?: Chain;
  tags?: string[];
}

const getAcceptsAddressesUncached = async (input: GetAcceptsAddressesInput) => {
  const { chain, tags } = input;
  const accepts = await scanDb.accepts.findMany({
    include: {
      resourceRel: {
        select: {
          origin: true,
        },
      },
    },
    where: {
      network: chain as AcceptsNetwork,
      ...(tags
        ? {
            resourceRel: {
              tags: {
                some: {
                  tag: { name: { in: tags } },
                },
              },
            },
          }
        : {}),
    },
  });

  return accepts
    .filter(accept => mixedAddressSchema.safeParse(accept.payTo).success)
    .reduce(
      (acc, accept) => {
        if (!accept.payTo) {
          return acc;
        }
        if (acc[accept.payTo]) {
          const existingOrigin = acc[accept.payTo]!.find(
            origin => origin.id === accept.resourceRel.origin.id
          );
          if (!existingOrigin) {
            acc[accept.payTo]!.push(accept.resourceRel.origin);
          }
        } else {
          acc[accept.payTo] = [accept.resourceRel.origin];
        }
        return acc;
      },
      {} as Record<string, Array<ResourceOrigin>>
    );
};

/**
 * Get accepts addresses grouped by origin (cached)
 * This is used to determine which addresses are "bazaar" sellers
 */
export const getAcceptsAddresses = createCachedQuery({
  queryFn: getAcceptsAddressesUncached,
  cacheKeyPrefix: 'accepts:addresses',
  createCacheKey: input =>
    createStandardCacheKey(input as Record<string, unknown>),
  dateFields: [],
  tags: ['accepts', 'bazaar'],
});
