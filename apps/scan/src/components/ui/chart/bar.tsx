"use client";

import { useId } from "react";
import { Bar } from "recharts";

import { BaseChart } from "./chart";
import { simulateChartData } from "./simulate";

import type {
  BarChartProps,
  BarSeries,
  ChartData,
  ChartValues,
  LoadingChartProps,
} from "./types";

const defaultBarMargin = { top: 4, right: 6, bottom: 0, left: 6 };
const loadingBarSeries: BarSeries<{ value: number }>[] = [
  {
    dataKey: "value",
    color: "var(--color-muted-foreground)",
    isAnimationActive: false,
  },
];

function BarChart<T extends ChartValues>({
  bars,
  children,
  height = 350,
  margin = defaultBarMargin,
  solid = false,
  stacked = true,
  width = "100%",
  ...props
}: BarChartProps<T>) {
  const gradientPrefix = useId().replaceAll(":", "");

  return (
    <BaseChart
      {...props}
      type="bar"
      height={height}
      margin={margin}
      width={width}
    >
      {!solid ? (
        <defs>
          {bars.map(({ dataKey, color }) => (
            <linearGradient
              key={dataKey}
              id={`${gradientPrefix}-${dataKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.08} />
            </linearGradient>
          ))}
        </defs>
      ) : null}
      {bars.map(({ dataKey, color, ...barProps }, index) => (
        <Bar<ChartData<T>, number>
          key={dataKey}
          dataKey={dataKey}
          fill={solid ? color : `url(#${gradientPrefix}-${dataKey})`}
          isAnimationActive={index === bars.length - 1}
          radius={
            index === bars.length - 1 || !stacked ? [4, 4, 0, 0] : undefined
          }
          stackId={stacked ? "1" : String(index)}
          stroke={color}
          strokeWidth={0.5}
          {...barProps}
        />
      ))}
      {children}
    </BaseChart>
  );
}

function LoadingBarChart({
  className,
  height = 350,
  width = "100%",
}: LoadingChartProps) {
  return (
    <div aria-hidden="true" data-slot="chart-loading" className={className}>
      <BarChart
        className="opacity-25 motion-safe:animate-pulse motion-reduce:animate-none"
        data={simulateChartData()}
        bars={loadingBarSeries}
        height={height}
        width={width}
      />
    </div>
  );
}

export { BarChart, LoadingBarChart };
