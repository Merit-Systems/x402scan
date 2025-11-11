export enum ActivityTimeframe {
  OneDay = 1,
  SevenDays = 7,
  FourteenDays = 14,
  ThirtyDays = 30,
}

/**
 * Timeframes that should be pre-warmed in the cache.
 * Excludes Custom since it's user-defined and cannot be pre-cached.
 */
export const CACHE_WARMABLE_TIMEFRAMES = [
  ActivityTimeframe.OneDay,
  ActivityTimeframe.SevenDays,
  ActivityTimeframe.FourteenDays,
  ActivityTimeframe.ThirtyDays,
] as const;
