import { scanDb } from '../../../../../../packages/internal/databases/scan/src';

import { mixedAddressSchema } from '@/lib/schemas';

import type { Chain } from '@/types/chain';
import type {
  AcceptsNetwork,
  Prisma,
} from '../../../../../../packages/internal/databases/scan/src';

interface GetAcceptsAddressesInput {
  chain?: Chain;
  tags?: string[];
}

export const getAcceptsAddresses = async (input: GetAcceptsAddressesInput) => {
  const { chain, tags } = input;
  const accepts = await scanDb.accepts.findMany({
    include: {
      resourceRel: {
        select: {
          origin: {
            include: {
              originMetrics: {
                take: 1,
                orderBy: {
                  updatedAt: 'desc',
                },
                select: {
                  uptime24hPct: true,
                  totalCount24h: true,
                  count_5xx_24h: true,
                  count_4xx_24h: true,
                  count_2xx_24h: true,
                  p50_24hMs: true,
                  p90_24hMs: true,
                  p99_24hMs: true,
                  updatedAt: true,
                },
              },
            },
          },
          _count: true,
          tags: true,
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

  type OriginWithMetrics = Prisma.ResourceOriginGetPayload<{
    include: {
      originMetrics: {
        take: 1;
        orderBy: {
          updatedAt: 'desc';
        };
        select: {
          uptime24hPct: true;
          totalCount24h: true;
          count_5xx_24h: true;
          count_4xx_24h: true;
          count_2xx_24h: true;
          p50_24hMs: true;
          p90_24hMs: true;
          p99_24hMs: true;
          updatedAt: true;
        };
      };
    };
  }>;

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
      {} as Record<string, Array<OriginWithMetrics>>
    );
};
