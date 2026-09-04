import { getTimeRangeFromTimeframe } from "@/lib/time-range";

import type { Prisma } from "@x402scan/transfers-db";
import type z from "zod";
import type { baseQuerySchema } from "./schemas";

export const transfersWhereObject = (
  input: z.infer<typeof baseQuerySchema>
): Prisma.TransferEventWhereInput => {
  const { chain, timeframe, senders, recipients, facilitatorIds } = input;

  const { startDate, endDate } = getTimeRangeFromTimeframe(timeframe);

  const blockTimestampFilter = {
    gte: startDate,
    lte: endDate,
  };

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
