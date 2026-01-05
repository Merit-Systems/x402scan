import z from 'zod';
import { Prisma } from '@x402scan/transfers-db';

import { chainSchema, mixedAddressSchema } from '@/lib/schemas';
import { toPaginatedResponse } from '@/lib/pagination';

import { baseListQuerySchema } from '../schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { getMaterializedViewSuffix } from '@/lib/time-range';

import type { paginatedQuerySchema } from '@/lib/pagination';

const SELLERS_SORT_IDS = [
  'tx_count',
  'total_amount',
  'latest_block_timestamp',
  'unique_buyers',
] as const;

export type SellerSortId = (typeof SELLERS_SORT_IDS)[number];

export const listTopSellersMVInputSchema = baseListQuerySchema({
  sortIds: SELLERS_SORT_IDS,
  defaultSortId: 'tx_count',
});

const listTopSellersMVUncached = async (
  input: z.infer<typeof listTopSellersMVInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting, timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `recipient_stats_aggregated_${mvTimeframe}`;

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

  if (input.recipients?.include && input.recipients.include.length > 0) {
    conditions.push(
      Prisma.sql`AND recipient = ANY(${input.recipients.include})`
    );
  }

  if (input.recipients?.exclude && input.recipients.exclude.length > 0) {
    conditions.push(
      Prisma.sql`AND NOT (recipient = ANY(${input.recipients.exclude}))`
    );
  }

  const whereClause = Prisma.join(conditions, ' ');

  const [count, items] = await Promise.all([
    queryRaw(
      Prisma.sql`
        SELECT COUNT(DISTINCT recipient)::integer AS count
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
        recipient,
        ARRAY_AGG(DISTINCT unnested_facilitator) as facilitator_ids,
        COALESCE(SUM(total_transactions), 0)::integer as tx_count,
        COALESCE(SUM(total_amount), 0)::float as total_amount,
        MAX(latest_block_timestamp) as latest_block_timestamp,
        COALESCE(SUM(unique_buyers), 0)::integer as unique_buyers,
        ARRAY_AGG(DISTINCT chain) as chains
      FROM ${Prisma.raw(tableName)},
        LATERAL unnest(facilitator_ids) AS unnested_facilitator
      ${whereClause}
      GROUP BY recipient
      ORDER BY ${Prisma.raw(`"${sorting.id}"`)} ${sorting.desc ? Prisma.raw('DESC') : Prisma.raw('ASC')}
      LIMIT ${pagination.page_size}
      OFFSET ${pagination.page * pagination.page_size}`,
      z.array(
        z.object({
          recipient: mixedAddressSchema,
          facilitator_ids: z.array(z.string()),
          tx_count: z.number(),
          total_amount: z.number(),
          latest_block_timestamp: z.date().nullable(),
          unique_buyers: z.number(),
          chains: z.array(chainSchema),
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

export const listTopSellersMV = createCachedPaginatedQuery({
  queryFn: listTopSellersMVUncached,
  cacheKeyPrefix: 'sellers-list-mv',
  createCacheKey: createStandardCacheKey,
  dateFields: ['latest_block_timestamp'],
  tags: ['sellers'],
});
