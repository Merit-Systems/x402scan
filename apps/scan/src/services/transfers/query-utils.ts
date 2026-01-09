import { Prisma } from '@x402scan/transfers-db';

import { getTimeRangeFromTimeframe } from '@/lib/time-range';

import type z from 'zod';
import type { baseQuerySchema } from './schemas';

export const transfersWhereClause = (
  input: z.infer<typeof baseQuerySchema>
) => {
  const { chain, timeframe, senders, recipients, facilitatorIds } = input;

  const { startDate, endDate } = getTimeRangeFromTimeframe(timeframe);

  return Prisma.sql`WHERE 1=1
    ${chain ? Prisma.sql`AND t.chain = ${chain}` : Prisma.empty}
    ${startDate ? Prisma.sql`AND t.block_timestamp >= ${startDate.toISOString()}::timestamp` : Prisma.empty}
    ${endDate ? Prisma.sql`AND t.block_timestamp <= ${endDate.toISOString()}::timestamp` : Prisma.empty}
    ${
      recipients?.include !== undefined && recipients.include.length > 0
        ? Prisma.sql`AND t.recipient = ANY(${recipients.include})`
        : Prisma.empty
    }
    ${
      recipients?.exclude !== undefined && recipients.exclude.length > 0
        ? Prisma.sql`AND NOT (t.recipient = ANY(${recipients.exclude}))`
        : Prisma.empty
    }
    ${
      senders?.include !== undefined && senders.include.length > 0
        ? Prisma.sql`AND t.sender = ANY(${senders.include})`
        : Prisma.empty
    }
    ${
      senders?.exclude !== undefined && senders.exclude.length > 0
        ? Prisma.sql`AND NOT (t.sender = ANY(${senders.exclude}))`
        : Prisma.empty
    }
    ${facilitatorIds ? Prisma.sql`AND t.facilitator_id = ANY(${facilitatorIds})` : Prisma.empty}
`;
};

export const transfersWhereObject = (
  input: z.infer<typeof baseQuerySchema>
): Prisma.TransferEventWhereInput => {
  const { chain, timeframe, senders, recipients, facilitatorIds } = input;

  const { startDate, endDate } = getTimeRangeFromTimeframe(timeframe);

  // Only include block_timestamp filter if we have dates (not All Time)
  const blockTimestampFilter =
    startDate || endDate
      ? {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        }
      : undefined;

  return {
    chain,
    block_timestamp: blockTimestampFilter,
    sender: {
      in: senders?.include,
      notIn: senders?.exclude,
    },
    recipient: {
      in: recipients?.include,
      notIn: recipients?.exclude,
    },
    facilitator_id: facilitatorIds ? { in: facilitatorIds } : undefined,
  };
};
