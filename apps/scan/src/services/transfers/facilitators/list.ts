import z from 'zod';
import { Prisma } from '@prisma/client';

import { baseListQuerySchema } from '../schemas';

import { queryRaw } from '@/services/transfers/client';
import { chainSchema } from '@/lib/schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';

import { facilitatorIdMap } from '@/lib/facilitators';
import {
  toPaginatedResponse,
  paginationClause,
  type paginatedQuerySchema,
} from '@/lib/pagination';
import { ActivityTimeframe } from '@/types/timeframes';
import { getMaterializedViewSuffix } from '@/lib/time-range';

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
}).extend({
  timeframe: z.nativeEnum(ActivityTimeframe).optional().default(ActivityTimeframe.OneDay),
});

const listTopFacilitatorsUncached = async (
  input: z.infer<typeof listTopFacilitatorsInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting, timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `stats_aggregated_${mvTimeframe}`;

  const sortColumnMap: Record<FacilitatorsSortId, string> = {
    tx_count: 'tx_count',
    total_amount: 'total_amount',
    latest_block_timestamp: 'latest_block_timestamp',
    unique_buyers: 'unique_buyers',
    unique_sellers: 'unique_sellers',
  };
  const sortColumn = sortColumnMap[sorting.id];
  const sortDirection = Prisma.raw(sorting.desc ? 'DESC' : 'ASC');

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    conditions.push(Prisma.sql`AND facilitator_id = ANY(${input.facilitatorIds})`);
  }

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  // Query aggregated stats from materialized view
  const results = await queryRaw(
    Prisma.sql`
      SELECT
        facilitator_id,
        SUM(total_transactions)::int AS tx_count,
        SUM(total_amount)::float AS total_amount,
        MAX(latest_block_timestamp) AS latest_block_timestamp,
        SUM(unique_buyers)::int AS unique_buyers,
        SUM(unique_sellers)::int AS unique_sellers,
        ARRAY_AGG(DISTINCT chain) as chains
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
      GROUP BY facilitator_id
      ORDER BY ${Prisma.raw(sortColumn)} ${sortDirection}
      ${paginationClause(pagination)}
    `,
    z.array(
      z.object({
        facilitator_id: z.string(),
        tx_count: z.number(),
        total_amount: z.number(),
        latest_block_timestamp: z.date(),
        unique_buyers: z.number(),
        unique_sellers: z.number(),
        chains: z.array(chainSchema),
      })
    )
  );

  // Get total count for pagination
  const countResult = await queryRaw(
    Prisma.sql`
      SELECT COUNT(DISTINCT facilitator_id)::int as count
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
    `,
    z.array(z.object({ count: z.number() }))
  );

  const count = countResult[0]?.count ?? 0;

  // Map facilitator metadata and addresses from facilitatorIdMap
  const items = results
    .map(result => {
      const facilitator = facilitatorIdMap.get(result.facilitator_id);
      if (!facilitator) {
        return null;
      }

      // Get all facilitator addresses across chains
      const facilitatorAddresses = Object.values(facilitator.addresses).flat();

      return {
        ...result,
        facilitator,
        facilitator_addresses: facilitatorAddresses,
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
