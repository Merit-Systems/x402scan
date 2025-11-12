'use client';

import { useTimeRangeContext } from './hook';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

import { ActivityTimeframe } from '@/types/timeframes';
import { CalendarDays } from 'lucide-react';

export const RangeSelector = () => {
  const { selectTimeframe, timeframe } = useTimeRangeContext();

  // Get only the numeric enum values
  const timeframeValues = Object.values(ActivityTimeframe).filter(
    value => typeof value === 'number'
  ) as ActivityTimeframe[];

  return (
    <Select
      value={timeframe.toString()}
      onValueChange={value => {
        selectTimeframe(Number(value));
      }}
    >
      <SelectTrigger className="border shadow-xs dark:border-input">
        <CalendarDays />
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
  );
};
