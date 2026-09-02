"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { ChartData, ChartTooltipRow, ChartValues } from "./types";
import type { ReactNode } from "react";

interface ChartTooltipContentProps<T extends ChartValues> {
  data: ChartData<T>;
  rows: ChartTooltipRow<T>[];
  formatLabel?: (timestamp: string, data: ChartData<T>) => ReactNode;
}

function defaultLabelFormatter(timestamp: string) {
  return timestamp;
}

function ChartTooltipContent<T extends ChartValues>({
  data,
  rows,
  formatLabel = defaultLabelFormatter,
}: ChartTooltipContentProps<T>) {
  const visibleRows = rows
    .filter((row) => row.dataKey in data)
    .slice()
    .sort((a, b) => Number(data[b.dataKey]) - Number(data[a.dataKey]));

  return (
    <Card
      data-slot="chart-tooltip"
      className="min-w-32 gap-0"
      variant="popover"
    >
      <div className="bg-muted px-2 py-1.5 type-label">
        {formatLabel(data.timestamp, data)}
      </div>
      <Separator />
      <div className="space-y-1 px-2 py-1.5">
        {visibleRows.map((row) => (
          <div
            key={String(row.dataKey)}
            className="flex w-full items-center justify-between gap-4 type-caption"
          >
            <div className="flex items-center gap-1.5">
              {row.color ? (
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              ) : null}
              <span className={cn("text-muted-foreground", row.labelClassName)}>
                {row.label}
              </span>
            </div>
            <span className={cn("type-label", row.valueClassName)}>
              {row.formatValue(data[row.dataKey], data)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export { ChartTooltipContent };
export type { ChartTooltipContentProps };
