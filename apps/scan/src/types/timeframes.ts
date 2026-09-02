export enum ActivityTimeframe {
  AllTime = 0,
  OneDay = 1,
  SevenDays = 7,
  FourteenDays = 14,
  ThirtyDays = 30,
}

/** Use sparingly - only for explicit "all time" queries where supported */
export const ALL_TIME_TIMEFRAME = ActivityTimeframe.AllTime;

/**
 * Every ActivityTimeframe value. The `satisfies Record<ActivityTimeframe, ...>`
 * check keeps this list exhaustive when the enum changes.
 */
const ACTIVITY_TIMEFRAME_MAP = {
  [ActivityTimeframe.AllTime]: ActivityTimeframe.AllTime,
  [ActivityTimeframe.OneDay]: ActivityTimeframe.OneDay,
  [ActivityTimeframe.SevenDays]: ActivityTimeframe.SevenDays,
  [ActivityTimeframe.FourteenDays]: ActivityTimeframe.FourteenDays,
  [ActivityTimeframe.ThirtyDays]: ActivityTimeframe.ThirtyDays,
} satisfies Record<ActivityTimeframe, ActivityTimeframe>;

export const ACTIVITY_TIMEFRAMES: ActivityTimeframe[] = Object.values(
  ACTIVITY_TIMEFRAME_MAP
);
