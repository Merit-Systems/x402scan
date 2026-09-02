import { z } from "zod";

import { ActivityTimeframe } from "@/types/timeframes";

type SearchParamValue = string | string[] | undefined;

const timeframeSchema = z.union([
  z.literal(ActivityTimeframe.AllTime),
  z.literal(ActivityTimeframe.OneDay),
  z.literal(ActivityTimeframe.SevenDays),
  z.literal(ActivityTimeframe.FifteenDays),
  z.literal(ActivityTimeframe.ThirtyDays),
]);
const timeframeParamSchema = z
  .string()
  .trim()
  .min(1)
  .transform(Number)
  .pipe(timeframeSchema);
const pageParamSchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().positive());

export const DEFAULT_DISCOVER_TIMEFRAME = ActivityTimeframe.ThirtyDays;
export const SERVICES_PAGE_SIZE = 15;

export const DISCOVER_TIMEFRAME_OPTIONS = [
  { label: "24h", value: ActivityTimeframe.OneDay },
  { label: "7d", value: ActivityTimeframe.SevenDays },
  { label: "15d", value: ActivityTimeframe.FifteenDays },
  { label: "30d", value: ActivityTimeframe.ThirtyDays },
  { label: "All", value: ActivityTimeframe.AllTime },
] as const;

const serviceViewSchema = z.enum(["featured", "all"]);
export type ServiceView = z.infer<typeof serviceViewSchema>;
export const DEFAULT_SERVICE_VIEW: ServiceView = "featured";

export function parseDiscoverTimeframe(
  raw: SearchParamValue
): ActivityTimeframe {
  const parsed = timeframeParamSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_DISCOVER_TIMEFRAME;
}

export function parseServiceView(raw: SearchParamValue): ServiceView {
  const parsed = serviceViewSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_SERVICE_VIEW;
}

export function parseDiscoverPage(raw: SearchParamValue): number {
  const parsed = pageParamSchema.safeParse(raw);
  return parsed.success ? parsed.data - 1 : 0;
}

export function formatDiscoverPage(page: number): string | null {
  return page > 0 ? (page + 1).toString() : null;
}
