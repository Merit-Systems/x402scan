import z from 'zod';

import { baseListQuerySchema } from '../schemas';

import { queryRaw, transfersPrisma } from '@/services/transfers/client';

import { chainSchema, mixedAddressSchema } from '@/lib/schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';

import { Prisma } from '@prisma/client';
import { facilitatorIdMap } from '@/lib/facilitators';
import { transfersWhereClause, transfersWhereObject } from '../query-utils';
import {
  toPaginatedResponse,
  paginationClause,
  type paginatedQuerySchema,
} from '@/lib/pagination';

const FACILITATORS_SORT_IDS = [
  'tx_count',
  'total_amount',
  'latest_block_timestamp',
  'unique_buyers',
  'unique_sellers',
] as const;

export type FacilitatorsSortId = (typeof FACILITATORS_SORT_IDS)[number];

export const listTopFacilitatorsInputSchema = baseListQuerySchema({
  sortIds: FACILITATORS_SORT_IDS,
  defaultSortId: FACILITATORS_SORT_IDS[0],
});

const listTopFacilitatorsUncached = async (
  input: z.infer<typeof listTopFacilitatorsInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting } = input;

  const sortColumnMap: Record<FacilitatorsSortId, string> = {
    tx_count: 'tx_count',
    total_amount: 'total_amount',
    latest_block_timestamp: 'latest_block_timestamp',
    unique_buyers: 'unique_buyers',
    unique_sellers: 'unique_sellers',
  };
  const sortColumn = sortColumnMap[sorting.id];
  const sortDirection = Prisma.raw(sorting.desc ? 'DESC' : 'ASC');

  const [count, results] = await Promise.all([
    transfersPrisma.transferEvent.count({
      where: transfersWhereObject(input),
    }),
    queryRaw(
      Prisma.sql`
      SELECT
        t.facilitator_id,
        COUNT(*)::int AS tx_count,
        SUM(t.amount)::float AS total_amount,
        MAX(t.block_timestamp) AS latest_block_timestamp,
        COUNT(DISTINCT t.sender)::int AS unique_buyers,
        COUNT(DISTINCT t.recipient)::int AS unique_sellers,
        ARRAY_AGG(DISTINCT t.transaction_from) as facilitator_addresses,
        ARRAY_AGG(DISTINCT t.chain) as chains
      FROM "TransferEvent" t
      ${transfersWhereClause(input)}
      GROUP BY t.facilitator_id
      ORDER BY ${Prisma.raw(sortColumn)} ${sortDirection}
      ${paginationClause(pagination)}
      `,
      z.array(
        z.object({
          facilitator_id: z.string(),
          facilitator_addresses: z.array(mixedAddressSchema),
          tx_count: z.number(),
          total_amount: z.number(),
          latest_block_timestamp: z.date(),
          unique_buyers: z.number(),
          unique_sellers: z.number(),
          chains: z.array(chainSchema),
        })
      )
    ),
  ]);

  const items = results
    .map(result => {
      const facilitator = facilitatorIdMap.get(result.facilitator_id);
      if (!facilitator) {
        return null;
      }

      return {
        ...result,
        facilitator,
      };
    })
    .filter((result): result is NonNullable<typeof result> => result !== null);

  return toPaginatedResponse({
    items,
    total_count: count,
    ...pagination,
  });
};

export const listTopFacilitators = createCachedPaginatedQuery({
  queryFn: listTopFacilitatorsUncached,
  cacheKeyPrefix: 'facilitators-list',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['facilitators'],
});
