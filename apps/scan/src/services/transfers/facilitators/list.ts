import z from 'zod';

import { baseListQuerySchema } from '../schemas';

import { queryRaw } from '@/services/transfers/client';

import { chainSchema, mixedAddressSchema } from '@/lib/schemas';
import {
  createCachedPaginatedQuery,
  createStandardCacheKey,
} from '@/lib/cache';

import { facilitatorIdMap } from '@/lib/facilitators';
import { transfersWhereClause } from '../query-utils';
import {
  toPaginatedResponse,
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
  const { sorting, page_size, page } = { ...input, ...pagination };

  const sortColumnMap: Record<FacilitatorsSortId, string> = {
    tx_count: 'tx_count',
    total_amount: 'total_amount',
    latest_block_timestamp: 'latest_block_timestamp',
    unique_buyers: 'unique_buyers',
    unique_sellers: 'unique_sellers',
  };
  const sortColumn = sortColumnMap[sorting.id];
  const sortDirection = sorting.desc ? 'DESC' : 'ASC';
  const whereClause = transfersWhereClause(input);
  const offset = page * page_size;

  const [countResult, results] = await Promise.all([
    queryRaw(
      `
        SELECT COUNT(*) as count
        FROM public_TransferEvent
        ${whereClause}
      `,
      z.array(z.object({ count: z.coerce.number() }))
    ),
    queryRaw(
      `
      SELECT
        facilitator_id,
        COUNT(*) AS tx_count,
        SUM(amount) AS total_amount,
        MAX(block_timestamp) AS latest_block_timestamp,
        uniq(sender) AS unique_buyers,
        uniq(recipient) AS unique_sellers,
        groupArrayDistinct(transaction_from) as facilitator_addresses,
        groupArrayDistinct(chain) as chains
      FROM public_TransferEvent
      ${whereClause}
      GROUP BY facilitator_id
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ${page_size + 1}
      OFFSET ${offset}
      `,
      z.array(
        z.object({
          facilitator_id: z.string(),
          facilitator_addresses: z.array(mixedAddressSchema),
          tx_count: z.coerce.number(),
          total_amount: z.number(),
          latest_block_timestamp: z.coerce.date(),
          unique_buyers: z.coerce.number(),
          unique_sellers: z.coerce.number(),
          chains: z.array(chainSchema),
        })
      )
    ),
  ]);

  const count = countResult[0]?.count ?? 0;

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
