"use client";

import {
  MotionToggleGroup,
  MotionToggleItem,
} from "@/components/ui/motion-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReplaceSearchParams } from "@/hooks/use-replace-search-params";
import {
  DEFAULT_USAGE_TIMEFRAME,
  USAGE_TIMEFRAME_OPTIONS,
} from "@/lib/timeframe";

import type { ActivityTimeframe } from "@/types/timeframes";

export function TimeframeSelect({
  timeframe,
}: {
  timeframe: ActivityTimeframe;
}) {
  const replaceSearchParams = useReplaceSearchParams();

  const setTimeframe = (nextTimeframe: ActivityTimeframe) => {
    if (nextTimeframe === timeframe) return;

    replaceSearchParams((params) => {
      if (nextTimeframe === DEFAULT_USAGE_TIMEFRAME) {
        params.delete("d");
      } else {
        params.set("d", nextTimeframe.toString());
      }

      params.delete("p");
    });
  };

  return (
    <>
      <Select
        value={timeframe.toString()}
        onValueChange={(value) => {
          const option = USAGE_TIMEFRAME_OPTIONS.find(
            (candidate) => candidate.value.toString() === value
          );
          if (option) setTimeframe(option.value);
        }}
      >
        <SelectTrigger
          aria-label="Usage timeframe"
          variant="ghost"
          size="sm"
          className="sm:hidden"
        >
          <SelectValue>
            {(value: string | null) =>
              USAGE_TIMEFRAME_OPTIONS.find(
                (option) => option.value.toString() === value
              )?.label ?? "Timeframe"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {USAGE_TIMEFRAME_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <MotionToggleGroup
        aria-label="Usage timeframe"
        value={timeframe.toString()}
        onValueChange={(value) => {
          const option = USAGE_TIMEFRAME_OPTIONS.find(
            (candidate) => candidate.value.toString() === value
          );
          if (option) setTimeframe(option.value);
        }}
        className="hidden sm:inline-flex"
      >
        {USAGE_TIMEFRAME_OPTIONS.map((option) => (
          <MotionToggleItem key={option.value} value={option.value.toString()}>
            {option.label}
          </MotionToggleItem>
        ))}
      </MotionToggleGroup>
    </>
  );
}
