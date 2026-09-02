"use client";

import { useId } from "react";
import { Area, Bar, Line } from "recharts";

import { BaseChart } from "./chart";
import { simulateChartData } from "./simulate";

import type {
  AreaSeries,
  ChartData,
  ChartValues,
  ComposedChartProps,
  LoadingChartProps,
} from "./types";

const defaultComposedMargin = { top: 4, right: 6, bottom: 0, left: 6 };
const emptySeries: never[] = [];
const loadingComposedAreas: AreaSeries<{ value: number }>[] = [
  {
    dataKey: "value",
    color: "var(--color-muted-foreground)",
    isAnimationActive: false,
  },
];

function ComposedChart<T extends ChartValues>({
  areas = emptySeries,
  bars = emptySeries,
  children,
  height = 350,
  lines = emptySeries,
  margin = defaultComposedMargin,
  width = "100%",
  ...props
}: ComposedChartProps<T>) {
  const gradientPrefix = useId().replaceAll(":", "");

  return (
    <BaseChart
      {...props}
      type="composed"
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
      {bars.map(({ dataKey, color, ...barProps }, index) => (
        <Bar<ChartData<T>, number>
          key={`bar-${dataKey}`}
          dataKey={dataKey}
          fill={`color-mix(in oklab, ${color} 40%, transparent)`}
          isAnimationActive={index === bars.length - 1}
          radius={[4, 4, 0, 0]}
          stackId={String(index)}
          stroke={color}
          {...barProps}
        />
      ))}
      {areas.map(({ dataKey, color, ...areaProps }, index) => (
        <Area<ChartData<T>, number>
          key={`area-${dataKey}`}
          dataKey={dataKey}
          fill={`url(#${gradientPrefix}-${dataKey})`}
          isAnimationActive={index === areas.length - 1}
          stackId="1"
          stroke={color}
          type="monotone"
          {...areaProps}
        />
      ))}
      {lines.map(({ dataKey, color, ...lineProps }, index) => (
        <Line<ChartData<T>, number>
          key={`line-${dataKey}`}
          dataKey={dataKey}
          dot={false}
          isAnimationActive={index === lines.length - 1}
          stroke={color}
          strokeWidth={1.5}
          type="monotone"
          {...lineProps}
        />
      ))}
      {children}
    </BaseChart>
  );
}

function LoadingComposedChart({
  className,
  height = 350,
  width = "100%",
}: LoadingChartProps) {
  return (
    <div aria-hidden="true" data-slot="chart-loading" className={className}>
      <ComposedChart
        className="opacity-25 motion-safe:animate-pulse motion-reduce:animate-none"
        data={simulateChartData()}
        areas={loadingComposedAreas}
        height={height}
        width={width}
      />
    </div>
  );
}

export { ComposedChart, LoadingComposedChart };
