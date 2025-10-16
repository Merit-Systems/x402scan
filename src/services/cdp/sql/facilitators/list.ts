import type { FacilitatorName } from '@/lib/facilitators';
import { facilitatorNameMap, facilitators } from '@/lib/facilitators';
import { runBaseSqlQuery } from '../query';
import { formatDateForSql, sortingSchema } from '../lib';
import z from 'zod';
import { ethereumAddressSchema } from '@/lib/schemas';
import { USDC_ADDRESS } from '@/lib/utils';
import { createCachedArrayQuery, createStandardCacheKey } from '@/lib/cache';
import { usdcAmountSchema, countValueSchema } from '@/lib/cdp/numeric-types';

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
});

const listTopFacilitatorsUncached = async (
  input: z.input<typeof listTopFacilitatorsInputSchema>
) => {
  const { startDate, endDate, limit, sorting, tokens } =
    listTopFacilitatorsInputSchema.parse(input);

  const sql = `SELECT 
    COUNT(DISTINCT parameters['to']::String) AS unique_sellers,
    COUNT(DISTINCT parameters['from']::String) AS unique_buyers,
    COUNT(*) AS tx_count, 
    SUM(parameters['value']::UInt256) AS total_amount,
    max(block_timestamp) AS latest_block_timestamp,
    CASE
    ${facilitators
      .map(
        f =>
          `WHEN transaction_from IN (${f.addresses
            .map(a => `'${a}'`)
            .join(', ')}) THEN '${f.name}'`
      )
      .join('\n        ')}
    ELSE 'Unknown'
    END AS facilitator_name
FROM base.events 
WHERE event_signature = 'Transfer(address,address,uint256)'
    AND address IN (${tokens.map(t => `'${t}'`).join(', ')})
    AND transaction_from IN (${facilitators
      .flatMap(f => f.addresses)
      .map(a => `'${a}'`)
      .join(', ')})
    ${
      startDate ? `AND block_timestamp >= '${formatDateForSql(startDate)}'` : ''
    }
    ${endDate ? `AND block_timestamp <= '${formatDateForSql(endDate)}'` : ''}
GROUP BY 
    CASE
    ${facilitators
      .map(
        f =>
          `WHEN transaction_from IN (${f.addresses
            .map(a => `'${a}'`)
            .join(', ')}) THEN '${f.name}'`
      )
      .join('\n        ')}
    ELSE 'Unknown'
    END
ORDER BY ${sorting.id} ${sorting.desc ? 'DESC' : 'ASC'} 
LIMIT ${limit + 1}`;
  const result = await runBaseSqlQuery(
    sql,
    z.array(
      z.object({
        unique_sellers: countValueSchema,
        unique_buyers: countValueSchema,
        tx_count: countValueSchema,
        total_amount: usdcAmountSchema,
        latest_block_timestamp: z.coerce.date(),
        facilitator_name: z.string().transform(v => v as FacilitatorName),
      })
    )
  );

  if (!result) {
    return [];
  }

  return result
    .map(r => ({
      ...r,
      facilitator: facilitatorNameMap.get(r.facilitator_name)!,
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
