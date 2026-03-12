import z from 'zod';

import { Prisma } from '@x402scan/transfers-db';

import { baseQuerySchema } from '../schemas';

import { queryRaw } from '@/services/transfers/client';
import { createCachedQuery, createStandardCacheKey } from '@/lib/cache';

import { transfersWhereClause } from '../query-utils';
import { ActivityTimeframe } from '@/types/timeframes';

export const getFirstTransferTimestampInputSchema = baseQuerySchema.omit({
  timeframe: true,
});

const getFirstTransferTimestampUncached = async (
  input: z.infer<typeof getFirstTransferTimestampInputSchema>
): Promise<{ timestamp: Date | null }> => {
  const sql = Prisma.sql`
    SELECT t.block_timestamp
    FROM "TransferEvent" t
    ${transfersWhereClause({ ...input, timeframe: ActivityTimeframe.ThirtyDays })}
    ORDER BY t.block_timestamp ASC
    LIMIT 1
  `;

  const result = await queryRaw(
    sql,
    z.array(
      z.object({
        block_timestamp: z.date(),
      })
    )
  );

  return { timestamp: result[0]?.block_timestamp ?? null };
};

const getFirstTransferTimestampCached = createCachedQuery({
  queryFn: getFirstTransferTimestampUncached,
  cacheKeyPrefix: 'first-transfer-timestamp',
  createCacheKey: input => createStandardCacheKey(input),
  dateFields: ['timestamp'],
  tags: ['transfers'],
});

export const getFirstTransferTimestamp = async (
  input: z.infer<typeof getFirstTransferTimestampInputSchema>
): Promise<Date | null> => {
  const result = await getFirstTransferTimestampCached(input);
  return result.timestamp;
};
