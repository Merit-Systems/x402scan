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

const BUYERS_SORT_IDS = [
  'tx_count',
  'total_amount',
  'latest_block_timestamp',
  'unique_sellers',
] as const;

export type BuyerSortId = (typeof BUYERS_SORT_IDS)[number];

export const listTopBuyersMVInputSchema = baseListQuerySchema({
  sortIds: BUYERS_SORT_IDS,
  defaultSortId: 'tx_count',
});

const listTopBuyersMVUncached = async (
  input: z.infer<typeof listTopBuyersMVInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting, timeframe } = input;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `sender_stats_aggregated_${mvTimeframe}`;

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

  if (input.senders?.include && input.senders.include.length > 0) {
    conditions.push(Prisma.sql`AND sender = ANY(${input.senders.include})`);
  }

  if (input.senders?.exclude && input.senders.exclude.length > 0) {
    conditions.push(
      Prisma.sql`AND NOT (sender = ANY(${input.senders.exclude}))`
    );
  }

  const whereClause = Prisma.join(conditions, ' ');

  const t0 = performance.now();
  const offset = pagination.page * pagination.page_size;

  try {
    // Group and paginate by sender first, then unnest facilitator_ids
    // in an outer query to avoid LATERAL UNNEST skewing LIMIT/OFFSET
    const items = await queryRaw(
      Prisma.sql`
    WITH paginated AS (
      SELECT
        sender,
        COALESCE(SUM(total_transactions), 0)::integer as tx_count,
        COALESCE(SUM(total_amount), 0)::float as total_amount,
        MAX(latest_block_timestamp) as latest_block_timestamp,
        COALESCE(SUM(unique_sellers), 0)::integer as unique_sellers,
        COALESCE(ARRAY_AGG(DISTINCT chain) FILTER (WHERE chain IS NOT NULL), ARRAY[]::text[]) as chains
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
      GROUP BY sender
      ORDER BY ${Prisma.raw(`"${sorting.id}"`)} ${sorting.desc ? Prisma.raw('DESC') : Prisma.raw('ASC')}
      LIMIT ${pagination.page_size}
      OFFSET ${offset}
    )
    SELECT
      p.sender,
      COALESCE(
        (SELECT ARRAY_AGG(DISTINCT f) FILTER (WHERE f IS NOT NULL)
         FROM ${Prisma.raw(tableName)} mv, LATERAL unnest(mv.facilitator_ids) AS f
         WHERE mv.sender = p.sender
           ${input.chain ? Prisma.sql`AND mv.chain = ${input.chain}` : Prisma.empty}),
        ARRAY[]::text[]
      ) as facilitator_ids,
      p.tx_count,
      p.total_amount,
      p.latest_block_timestamp,
      p.unique_sellers,
      p.chains
    FROM paginated p
    ORDER BY ${Prisma.raw(`"${sorting.id}"`)} ${sorting.desc ? Prisma.raw('DESC') : Prisma.raw('ASC')}`,
      z.array(
        z.object({
          sender: mixedAddressSchema,
          facilitator_ids: z.array(z.string()),
          tx_count: z.number(),
          total_amount: z.number(),
          latest_block_timestamp: z.date().nullable(),
          unique_sellers: z.number(),
          chains: z.array(chainSchema),
        })
      )
    );

    console.log(
      `[buyers-mv] main query ${tableName} ${(performance.now() - t0).toFixed(0)}ms (${items.length} rows)`
    );

    let count: number;

    if (items.length < pagination.page_size) {
      count = offset + items.length;
    } else {
      const countResult = await queryRaw(
        Prisma.sql`
        SELECT COUNT(DISTINCT sender)::integer AS count
        FROM ${Prisma.raw(tableName)}
        ${whereClause}
      `,
        z.array(
          z.object({
            count: z.number(),
          })
        )
      );
      count = countResult[0]?.count ?? 0;
      console.log(
        `[buyers-mv] count query ${tableName} ${(performance.now() - t0).toFixed(0)}ms`
      );
    }

    return toPaginatedResponse({
      items,
      total_count: count,
      ...pagination,
    });
  } catch (error) {
    if (String(error).includes('does not exist')) {
      console.warn(
        `[buyers-mv] MV ${tableName} not yet available, returning empty`
      );
      return toPaginatedResponse({
        items: [],
        total_count: 0,
        ...pagination,
      });
    }
    throw error;
  }
};

export const listTopBuyersMV = createCachedPaginatedQuery({
  queryFn: listTopBuyersMVUncached,
  cacheKeyPrefix: 'buyers-list-mv',
  createCacheKey: createStandardCacheKey,
  dateFields: ['latest_block_timestamp'],
  tags: ['buyers'],
});
