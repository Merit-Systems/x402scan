import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { chainSchema } from '@/lib/schemas';
import { toPaginatedResponse } from '@/lib/pagination';

import { baseListQuerySchema } from '../schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

import type { paginatedQuerySchema } from '@/lib/pagination';

const ORIGINS_SORT_IDS = [
  'total_transactions',
  'total_amount',
  'latest_block_timestamp',
  'unique_buyers',
] as const;

export type OriginSortId = (typeof ORIGINS_SORT_IDS)[number];

export const listTopOriginsMVInputSchema = baseListQuerySchema({
  sortIds: ORIGINS_SORT_IDS,
  defaultSortId: 'total_transactions',
});

const listTopOriginsMVUncached = async (
  input: z.infer<typeof listTopOriginsMVInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting, timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `origin_stats_aggregated_${mvTimeframe}`;

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    conditions.push(
      Prisma.sql`AND ${input.facilitatorIds}::text[] && facilitator_ids`
    );
  }

  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  const [count, items] = await Promise.all([
    queryRaw(
      Prisma.sql`
        SELECT COUNT(DISTINCT "originId")::integer AS count
        FROM ${Prisma.raw(tableName)}
        ${whereClause}
      `,
      z.array(
        z.object({
          count: z.number(),
        })
      )
    ).then(result => result[0]?.count ?? 0),
    queryRaw(
      Prisma.sql`
      SELECT 
        "originId" as origin_id,
        ARRAY_AGG(DISTINCT chain) as chains,
        COALESCE(SUM(total_transactions), 0)::integer as total_transactions,
        COALESCE(SUM(total_amount), 0)::float as total_amount,
        MAX(latest_block_timestamp) as latest_block_timestamp,
        COALESCE(SUM(unique_buyers), 0)::integer as unique_buyers
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
      GROUP BY "originId"
      ORDER BY ${Prisma.raw(`"${sorting.id}"`)} ${sorting.desc ? Prisma.raw('DESC') : Prisma.raw('ASC')}
      LIMIT ${pagination.page_size}
      OFFSET ${pagination.page * pagination.page_size}`,
      z.array(
        z.object({
          origin_id: z.string(),
          chains: z.array(chainSchema),
          total_transactions: z.number(),
          total_amount: z.number(),
          latest_block_timestamp: z.date().nullable(),
          unique_buyers: z.number(),
        })
      )
    ),
  ]);

  return toPaginatedResponse({
    items,
    total_count: count,
    ...pagination,
  });
};

export const listTopOriginsMV = createCachedPaginatedQuery({
  queryFn: listTopOriginsMVUncached,
  cacheKeyPrefix: 'origins-list-mv',
  createCacheKey: createStandardCacheKey,
  dateFields: ['latest_block_timestamp'],
  tags: ['origins'],
});
