import type { FacilitatorName } from '@/lib/facilitators';
import { facilitatorNameMap, facilitators } from '@/lib/facilitators';
import { queryIndexerDb } from '../client';
import { sortingSchema } from '../lib';
import z from 'zod';
import { ethereumAddressSchema } from '@/lib/schemas';
import { USDC_ADDRESS } from '@/lib/utils';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';

const listTopFacilitatorsSortIds = [
  'tx_count',
  'total_amount',
  'latest_block_timestamp',
  'unique_buyers',
  'unique_sellers',
] as const;

export type FacilitatorsSortId = (typeof listTopFacilitatorsSortIds)[number];

export const listTopFacilitatorsInputSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  limit: z.number().default(100),
  sorting: sortingSchema(listTopFacilitatorsSortIds).default({
    id: 'tx_count',
    desc: true,
  }),
  tokens: z.array(ethereumAddressSchema).default([USDC_ADDRESS]),
  chain: z.enum(['base', 'solana', 'polygon']).default('base'),
});

const listTopFacilitatorsUncached = async (
  input: z.input<typeof listTopFacilitatorsInputSchema>
) => {
  const { startDate, endDate, limit, sorting, tokens, chain } =
    listTopFacilitatorsInputSchema.parse(input);

  // Build CASE statement for facilitator names
  const facilitatorCases = facilitators
    .map(
      f =>
        `WHEN transaction_from = ANY(ARRAY[${f.addresses.map(a => `'${a}'`).join(', ')}]) THEN '${f.name}'`
    )
    .join('\n        ');

  let paramIndex = 1;
  const params: unknown[] = [tokens, chain];
  const facilitatorAddresses = facilitators.flatMap(f => f.addresses);
  params.push(facilitatorAddresses);
  
  let whereClause = `
    WHERE address = ANY($${paramIndex++})
      AND chain = $${paramIndex++}
      AND transaction_from = ANY($${paramIndex++})
  `;

  if (startDate) {
    whereClause += ` AND block_timestamp >= $${paramIndex++}`;
    params.push(startDate);
  }
  
  if (endDate) {
    whereClause += ` AND block_timestamp <= $${paramIndex++}`;
    params.push(endDate);
  }

  params.push(limit + 1);

  const sql = `
    SELECT 
      COUNT(DISTINCT recipient)::bigint AS unique_sellers,
      COUNT(DISTINCT sender)::bigint AS unique_buyers,
      COUNT(*)::bigint AS tx_count,
      SUM(amount::numeric)::bigint AS total_amount,
      MAX(block_timestamp) AS latest_block_timestamp,
      CASE
        ${facilitatorCases}
        ELSE 'Unknown'
      END AS facilitator_name
    FROM "TransferEvent"
    ${whereClause}
    GROUP BY 
      CASE
        ${facilitatorCases}
        ELSE 'Unknown'
      END
    ORDER BY ${sorting.id} ${sorting.desc ? 'DESC' : 'ASC'}
    LIMIT $${paramIndex++}
  `;

  const result = await queryIndexerDb<{
    unique_sellers: string;
    unique_buyers: string;
    tx_count: string;
    total_amount: string;
    latest_block_timestamp: Date;
    facilitator_name: string;
  }>(sql, params);

  if (!result) {
    return [];
  }

  return result
    .map(r => ({
      unique_sellers: Number(r.unique_sellers),
      unique_buyers: Number(r.unique_buyers),
      tx_count: Number(r.tx_count),
      total_amount: Number(r.total_amount),
      latest_block_timestamp: r.latest_block_timestamp,
      facilitator_name: r.facilitator_name as FacilitatorName,
      facilitator: facilitatorNameMap.get(r.facilitator_name as FacilitatorName)!,
    }))
    .slice(0, limit);
};

export const listTopFacilitators = createCachedArrayQuery({
  queryFn: listTopFacilitatorsUncached,
  cacheKeyPrefix: 'facilitators-list',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['latest_block_timestamp'],
  tags: ['facilitators'],
});

