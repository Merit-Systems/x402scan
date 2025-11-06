export enum ActivityTimeframe {
  OneDay = 1,
  ThreeDays = 3,
  SevenDays = 7,
  FifteenDays = 15,
  ThirtyDays = 30,
  SixtyDays = 60,
  NinetyDays = 90,
  AllTime = 999999,
}

/**
 * Timeframes that should be pre-warmed in the cache.
 * Excludes Custom since it's user-defined and cannot be pre-cached.
 */
export const CACHE_WARMABLE_TIMEFRAMES = [
  ActivityTimeframe.OneDay,
  ActivityTimeframe.ThreeDays,
  ActivityTimeframe.SevenDays,
  ActivityTimeframe.FifteenDays,
  ActivityTimeframe.ThirtyDays,
  ActivityTimeframe.SixtyDays,
  ActivityTimeframe.NinetyDays,
  ActivityTimeframe.AllTime,
] as const;
