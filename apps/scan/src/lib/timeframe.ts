import { z } from "zod";

import { ActivityTimeframe } from "@/types/timeframes";

type SearchParamValue = string | string[] | undefined;

const timeframeSchema = z.union([
  z.literal(ActivityTimeframe.AllTime),
  z.literal(ActivityTimeframe.OneDay),
  z.literal(ActivityTimeframe.SevenDays),
  z.literal(ActivityTimeframe.FourteenDays),
  z.literal(ActivityTimeframe.ThirtyDays),
]);

const timeframeParamSchema = z
  .string()
  .trim()
  .min(1)
  .transform(Number)
  .pipe(timeframeSchema);

export const DEFAULT_USAGE_TIMEFRAME = ActivityTimeframe.ThirtyDays;

export const USAGE_TIMEFRAME_OPTIONS = [
  { label: "24h", value: ActivityTimeframe.OneDay },
  { label: "7d", value: ActivityTimeframe.SevenDays },
  { label: "14d", value: ActivityTimeframe.FourteenDays },
  { label: "30d", value: ActivityTimeframe.ThirtyDays },
  { label: "All", value: ActivityTimeframe.AllTime },
] as const;

export function parseUsageTimeframe(raw: SearchParamValue): ActivityTimeframe {
  const parsed = timeframeParamSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_USAGE_TIMEFRAME;
}
