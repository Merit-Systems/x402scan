"use client";

import { useId } from "react";
import { Area } from "recharts";

import { BaseChart } from "./chart";
import { simulateChartData } from "./simulate";

import type {
  AreaChartProps,
  AreaSeries,
  ChartData,
  ChartValues,
  LoadingChartProps,
} from "./types";

const defaultAreaMargin = { top: 4, right: 0, bottom: 4, left: 0 };
const loadingAreaSeries: AreaSeries<{ value: number }>[] = [
  {
    dataKey: "value",
    color: "var(--color-muted-foreground)",
    isAnimationActive: false,
  },
];

function AreaChart<T extends ChartValues>({
  areas,
  children,
  height = 350,
  margin = defaultAreaMargin,
  width = "100%",
  ...props
}: AreaChartProps<T>) {
  const gradientPrefix = useId().replaceAll(":", "");

  return (
    <BaseChart
      {...props}
      type="area"
      height={height}
      margin={margin}
      width={width}
    >
      <defs>
        {areas.map(({ dataKey, color }) => (
          <linearGradient
            key={dataKey}
            id={`${gradientPrefix}-${dataKey}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {areas.map(({ dataKey, color, ...areaProps }, index) => (
        <Area<ChartData<T>, number>
          key={dataKey}
          activeDot={false}
          dataKey={dataKey}
          dot={false}
          fill={`url(#${gradientPrefix}-${dataKey})`}
          isAnimationActive={index === areas.length - 1}
          stackId="1"
          stroke={color}
          strokeWidth={1}
          type="monotone"
          {...areaProps}
        />
      ))}
      {children}
    </BaseChart>
  );
}

function LoadingAreaChart({
  className,
  height = 350,
  width = "100%",
}: LoadingChartProps) {
  return (
    <div aria-hidden="true" data-slot="chart-loading" className={className}>
      <AreaChart
        className="opacity-25 motion-safe:animate-pulse motion-reduce:animate-none"
        data={simulateChartData()}
        areas={loadingAreaSeries}
        height={height}
        width={width}
      />
    </div>
  );
}

export { AreaChart, LoadingAreaChart };
