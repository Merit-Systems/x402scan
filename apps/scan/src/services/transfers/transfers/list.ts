import z from 'zod';
import { Prisma, transfersDb } from '@x402scan/transfers-db';

import {
  toPaginatedResponse,
  type paginatedQuerySchema,
} from '@/lib/pagination';
import { baseListQuerySchema } from '../schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';
import type { MixedAddress } from '@/types/address';
import type { Chain } from '@/types/chain';
import { transfersWhereObject } from '../query-utils';
import { getMaterializedViewSuffix } from '@/lib/time-range';
import { queryRaw } from '@/services/transfers/client';

const TRANSFERS_SORT_IDS = ['block_timestamp', 'amount'] as const;
export type TransfersSortId = (typeof TRANSFERS_SORT_IDS)[number];

export const listFacilitatorTransfersInputSchema = baseListQuerySchema({
  sortIds: TRANSFERS_SORT_IDS,
  defaultSortId: 'block_timestamp',
});

const listFacilitatorTransfersUncached = async (
  input: z.infer<typeof listFacilitatorTransfersInputSchema>,
  pagination: z.infer<typeof paginatedQuerySchema>
) => {
  const { sorting, timeframe } = input;
  const { page_size, page } = pagination;

  // Get count from materialized view (fast)
  const mvTimeframe = getMaterializedViewSuffix(timeframe);
  const tableName = `stats_aggregated_${mvTimeframe}`;

  const conditions: Prisma.Sql[] = [Prisma.sql`WHERE 1=1`];
  if (input.facilitatorIds && input.facilitatorIds.length > 0) {
    conditions.push(
      Prisma.sql`AND facilitator_id = ANY(${input.facilitatorIds})`
    );
  }
  if (input.chain) {
    conditions.push(Prisma.sql`AND chain = ${input.chain}`);
  }
  const whereClause = Prisma.join(conditions, ' ');

  const countQuery = queryRaw(
    Prisma.sql`
      SELECT COALESCE(SUM(total_transactions), 0)::int AS count
      FROM ${Prisma.raw(tableName)}
      ${whereClause}
    `,
    z.array(z.object({ count: z.number() }))
  );

  // Get actual transfers from raw table (needed for individual rows)
  const where = transfersWhereObject(input);
  const transfersQuery = transfersDb.transferEvent.findMany({
    where,
    orderBy: {
      [sorting.id]: sorting.desc ? 'desc' : 'asc',
    },
    take: page_size + 1,
    skip: page * page_size,
  });

  const [countResult, transfers] = await Promise.all([
    countQuery,
    transfersQuery,
  ]);
  const count = countResult[0]?.count ?? 0;

  // Map to expected output format
  const items = transfers.map(transfer => ({
    ...transfer,
    sender: transfer.sender as MixedAddress,
    recipient: transfer.recipient as MixedAddress,
    token_address: transfer.address as MixedAddress,
    transaction_from: transfer.transaction_from as MixedAddress,
    chain: transfer.chain as Chain,
  }));

  return toPaginatedResponse({
    items,
    total_count: count,
    ...pagination,
  });
};

export const listFacilitatorTransfers = createCachedPaginatedQuery({
  queryFn: listFacilitatorTransfersUncached,
  cacheKeyPrefix: 'transfers-list',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['block_timestamp'],
  tags: ['transfers'],
});
