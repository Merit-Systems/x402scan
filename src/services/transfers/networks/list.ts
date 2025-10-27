import { baseQuerySchema } from '../schemas';
import z from 'zod';
import { chainSchema, sortingSchema } from '@/lib/schemas';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { queryRaw } from '@/services/transfers/client';
import { Prisma } from '@prisma/client';
import type { Chain } from '@/types/chain';
import { CHAIN_LABELS, CHAIN_ICONS } from '@/types/chain';

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
  startDate: z.date().optional(),
  endDate: z.date().optional(),
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
  const { startDate, endDate, limit, sorting, chain } = parsed;

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

  const sql = Prisma.sql`
    SELECT 
      t.chain,
      COUNT(*)::int AS tx_count,
      SUM(t.amount)::float AS total_amount,
      MAX(t.block_timestamp) AS latest_block_timestamp,
      COUNT(DISTINCT t.sender)::int AS unique_buyers,
      COUNT(DISTINCT t.recipient)::int AS unique_sellers,
      COUNT(DISTINCT t.facilitator_id)::int AS unique_facilitators
    FROM "TransferEvent" t
    WHERE 1=1
      ${chain ? Prisma.sql`AND t.chain = ${chain}` : Prisma.empty}
      ${startDate ? Prisma.sql`AND t.block_timestamp >= ${startDate}` : Prisma.empty}
      ${endDate ? Prisma.sql`AND t.block_timestamp <= ${endDate}` : Prisma.empty}
    GROUP BY t.chain
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
