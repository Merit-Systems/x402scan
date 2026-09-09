"use client";

import { ChartColumn, ChartSpline } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { useChartMode } from "./hook";
import type { ChartMode } from "./context";

const modeNames = {
  bucketed: "Per Bucket",
  cumulative: "Cumulative",
} satisfies Record<ChartMode, string>;

export const ChartModeSelector = () => {
  const { chartMode, selectChartMode } = useChartMode();

  return (
    <Select
      value={chartMode}
      onValueChange={(value) => {
        if (value === "bucketed" || value === "cumulative") {
          selectChartMode(value);
        }
      }}
    >
      <SelectTrigger className="border shadow-xs dark:border-input">
        {chartMode === "cumulative" ? <ChartSpline /> : <ChartColumn />}
        <span>{modeNames[chartMode]}</span>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="bucketed">{modeNames.bucketed}</SelectItem>
        <SelectItem value="cumulative">{modeNames.cumulative}</SelectItem>
      </SelectContent>
    </Select>
  );
};
