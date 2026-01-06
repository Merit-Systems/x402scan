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

  const timeframeNames = {
    [ActivityTimeframe.OneDay]: 'Past 24 Hours',
    [ActivityTimeframe.SevenDays]: 'Past 7 Days',
    [ActivityTimeframe.FifteenDays]: 'Past 15 Days',
    [ActivityTimeframe.ThirtyDays]: 'Past 30 Days',
  };

  return (
    <Select
      value={timeframe.toString()}
      onValueChange={value => {
        selectTimeframe(Number(value));
      }}
    >
      <SelectTrigger className="border shadow-xs dark:border-input">
        <CalendarDays />
        <span>{timeframeNames[timeframe]}</span>
      </SelectTrigger>
      <SelectContent align="end">
        {timeframeValues.map(value => (
          <SelectItem key={value} value={value.toString()}>
            {timeframeNames[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
