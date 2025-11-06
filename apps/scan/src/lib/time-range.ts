import { subHours, subMinutes } from 'date-fns';

import type { timeframeSchema } from './schemas';
import type z from 'zod';

type AllTimeWithCreationProps = {
  timeframe: 0;
  creationDate: Date;
};

type AllTimeWithoutCreationProps = {
  timeframe: 0;
  creationDate?: undefined;
};

export type NonZeroTimeframe = Exclude<number, 0> & { _not_zero: true };

type NonZeroTimeframeProps = {
  timeframe: NonZeroTimeframe;
  creationDate?: undefined;
};

type OtherTimeframeProps = {
  timeframe: z.infer<typeof timeframeSchema>;
  creationDate?: undefined;
};

type Props =
  | AllTimeWithCreationProps
  | AllTimeWithoutCreationProps
  | NonZeroTimeframeProps
  | OtherTimeframeProps;

type Return<P extends Props> = P extends
  | AllTimeWithCreationProps
  | NonZeroTimeframeProps
  ? { startDate: Date; endDate: Date }
  : { startDate: undefined; endDate: Date };

export function getTimeRangeFromTimeframe<P extends Props>(
  props: P
): Return<P> {
  const now = new Date();
  const endDate =
    typeof props.timeframe === 'number' || !props.timeframe.offset
      ? now
      : subHours(now, props.timeframe.offset * 24);

  if (props.timeframe === 0) {
    if (props.creationDate !== undefined) {
      return {
        startDate: props.creationDate,
        endDate,
      } as Return<P>;
    } else {
      return {
        startDate: undefined,
        endDate,
      } as Return<P>;
    }
  }

  // For all other timeframes, calculate from endDate
  // Using hours instead of days because of daylight savings.
  const startDate =
    typeof props.timeframe === 'number'
      ? subHours(endDate, props.timeframe * 24)
      : subHours(endDate, props.timeframe.period * 24);

  return { startDate, endDate } as Return<P>;
}

export const 
