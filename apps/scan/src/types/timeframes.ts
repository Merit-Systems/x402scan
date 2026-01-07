export enum ActivityTimeframe {
  AllTime = 0,
  OneDay = 1,
  SevenDays = 7,
  FifteenDays = 14,
  ThirtyDays = 30,
}

/** Use sparingly - only for explicit "all time" queries where supported */
export const ALL_TIME_TIMEFRAME = ActivityTimeframe.AllTime;
