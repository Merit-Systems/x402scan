import { baseQuerySchema } from '../schemas';
import z from 'zod';
import { chainSchema, sortingSchema } from '@/lib/schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { Prisma } from '@prisma/client';
import type { Chain } from '@/types/chain';
import { CHAIN_LABELS, CHAIN_ICONS } from '@/types/chain';
import { ActivityTimeframe } from '@/types/timeframes';
import { getMaterializedViewSuffix } from '@/lib/time-range';

const listTopNetworksSortIds = [
  'tx_count',
  'total_amount',
  'latest_block_timestamp',
  'unique_buyers',
  'unique_sellers',
  'unique_facilitators',
] as const;

export type NetworksSortId = (typeof listTopNetworksSortIds)[number];

export const listTopNetworksInputSchema = baseQuerySchema.extend({
  timeframe: z.nativeEnum(ActivityTimeframe).optional().default(ActivityTimeframe.OneDay),
  limit: z.number().default(100),
  sorting: sortingSchema(listTopNetworksSortIds).default({
    id: 'tx_count',
    desc: true,
  }),
});

type NetworkItem = {
  chain: Chain;
  label: string;
  icon: string;
  tx_count: number;
  total_amount: number;
  latest_block_timestamp: Date;
  unique_buyers: number;
  unique_sellers: number;
  unique_facilitators: number;
};

const listTopNetworksUncached = async (
  input: z.input<typeof listTopNetworksInputSchema>
): Promise<NetworkItem[]> => {
  const parsed = listTopNetworksInputSchema.parse(input);
  const { timeframe, limit, sorting, chain } = parsed;

  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `stats_aggregated_${mvTimeframe}`;

  const sortColumnMap: Record<NetworksSortId, string> = {
    tx_count: 'tx_count',
    total_amount: 'total_amount',
    latest_block_timestamp: 'latest_block_timestamp',
    unique_buyers: 'unique_buyers',
    unique_sellers: 'unique_sellers',
    unique_facilitators: 'unique_facilitators',
  };
  const sortColumn = sortColumnMap[sorting.id as NetworksSortId];
  const sortDirection = Prisma.raw(sorting.desc ? 'DESC' : 'ASC');

  // Build WHERE clause for materialized view
  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];

  if (chain) {
    conditions.push(Prisma.sql`AND chain = ${chain}`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  const sql = Prisma.sql`
    SELECT 
      chain,
      SUM(total_transactions)::int AS tx_count,
      SUM(total_amount)::float AS total_amount,
      MAX(latest_block_timestamp) AS latest_block_timestamp,
      SUM(unique_buyers)::int AS unique_buyers,
      SUM(unique_sellers)::int AS unique_sellers,
      COUNT(DISTINCT facilitator_id)::int AS unique_facilitators
    FROM ${Prisma.raw(tableName)}
    ${whereClause}
    GROUP BY chain
    ORDER BY ${Prisma.raw(sortColumn)} ${sortDirection}
    LIMIT ${limit}
  `;

  const results = await queryRaw(
    sql,
    z.array(
      z.object({
        chain: chainSchema,
        tx_count: z.number(),
        total_amount: z.number(),
        latest_block_timestamp: z.date(),
        unique_buyers: z.number(),
        unique_sellers: z.number(),
        unique_facilitators: z.number(),
      })
    )
  );

  // Map results to include network metadata
  return results.map(row => ({
    chain: row.chain,
    label: CHAIN_LABELS[row.chain],
    icon: CHAIN_ICONS[row.chain],
    tx_count: row.tx_count,
    total_amount: row.total_amount,
    latest_block_timestamp: row.latest_block_timestamp,
    unique_buyers: row.unique_buyers,
    unique_sellers: row.unique_sellers,
    unique_facilitators: row.unique_facilitators,
  }));
};

export const listTopNetworks = createCachedArrayQuery({
  queryFn: listTopNetworksUncached,
  cacheKeyPrefix: 'networks-list',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['networks'],
});

