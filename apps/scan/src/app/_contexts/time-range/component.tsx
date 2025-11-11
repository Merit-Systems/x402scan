'use client';

import { format } from 'date-fns';

import { useTimeRangeContext } from './hook';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

import { ActivityTimeframe } from '@/types/timeframes';

export const RangeSelector = () => {
  const { selectTimeframe, timeframe } =
    useTimeRangeContext();

  // Get only the numeric enum values
  const timeframeValues = Object.values(ActivityTimeframe).filter(
    value => typeof value === 'number'
  ) as ActivityTimeframe[];

  return (
    <div className="flex items-center">
      <Select
        value={timeframe.toString()}
        onValueChange={value => {
          selectTimeframe(Number(value));
        }}
      >
        <SelectTrigger className="rounded-l-none border border-l-[0.5px] shadow-xs dark:border-input">
          <span>
            {timeframe === ActivityTimeframe.OneDay
              ? 'Past 24 Hours'
              : `Past ${timeframe} Days`}
          </span>
        </SelectTrigger>
        <SelectContent align="end">
          {timeframeValues.map(value => (
            <SelectItem key={value} value={value.toString()}>
              {value === ActivityTimeframe.OneDay
                ? 'Past 24 Hours'
                : `Past ${value} Days`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
