import { subHours } from "date-fns";

import { z } from "zod";
import type { timeframeSchema, timePeriodSchema } from "./schemas";
import { ActivityTimeframe } from "@/types/timeframes";

interface TimeframeParts {
  period: number;
  offset?: number;
}

/**
 * Normalize the timeframe union (bare period number or {period, offset})
 * into one parts object so consumers never re-inspect the union.
 */
const timeframePartsSchema = z.union([
  z.number().transform((period): TimeframeParts => ({ period })),
  z.object({ period: z.number(), offset: z.number().optional() }),
]);

const toTimeframeParts = (
  timeframe: number | { period: number; offset?: number | undefined }
): TimeframeParts => timeframePartsSchema.parse(timeframe);

export function getTimeRangeFromTimeframe(
  timeframe: z.infer<typeof timeframeSchema>
) {
  const now = new Date();

  const { period, offset } = toTimeframeParts(timeframe);
  if (period === 0) {
    // Use a floor date instead of null so TimescaleDB can still do
    // chunk exclusion and Prisma always emits a block_timestamp filter.
    // All TransferEvent data starts 2025-05-09; this won't exclude anything.
    return { startDate: new Date("2024-01-01T00:00:00Z"), endDate: now };
  }

  const endDate = offset ? subHours(now, offset * 24) : now;

  // For all other timeframes, calculate from endDate
  // Using hours instead of days because of daylight savings.
  const startDate = subHours(endDate, period * 24);

  return { startDate, endDate };
}

interface BucketedTimeframeProps {
  period: z.infer<typeof timePeriodSchema>;
  creationDate: Date | (() => Promise<Date>);
}

export const getBucketedTimeRangeFromTimeframe = async ({
  period,
  creationDate,
}: BucketedTimeframeProps) => {
  const now = new Date();
  const endDate = now;

  // Handle All Time (0) and ThirtyDays - use creation date as start
  if (
    period === ActivityTimeframe.AllTime ||
    period === ActivityTimeframe.ThirtyDays
  ) {
    return {
      startDate:
        creationDate instanceof Date ? creationDate : await creationDate(),
      endDate,
    };
  }
  const startDate = subHours(endDate, period * 24);

  return { startDate, endDate };
};

export function getMaterializedViewSuffix(
  timeframe:
    | number
    | {
        period: number;
        offset?: number | undefined;
      }
): string {
  return `${toTimeframeParts(timeframe).period}d`;
}
