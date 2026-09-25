"use client";

import { Line } from "recharts";

import { BaseChart } from "./chart";
import { simulateChartData } from "./simulate";

import type {
  ChartData,
  ChartValues,
  LineChartProps,
  LineSeries,
  LoadingChartProps,
} from "./types";

const defaultLineMargin = { top: 4, right: 0, bottom: 0, left: 0 };
const loadingLineSeries: LineSeries<{ value: number }>[] = [
  {
    dataKey: "value",
    color: "var(--color-muted-foreground)",
    isAnimationActive: false,
  },
];

function LineChart<T extends ChartValues>({
  children,
  height = 350,
  lines,
  margin = defaultLineMargin,
  width = "100%",
  ...props
}: LineChartProps<T>) {
  return (
    <BaseChart
      {...props}
      type="line"
      height={height}
      margin={margin}
      width={width}
    >
      {lines.map(({ dataKey, color, ...lineProps }, index) => (
        <Line<ChartData<T>, number>
          key={dataKey}
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

function LoadingLineChart({
  className,
  height = 350,
  width = "100%",
}: LoadingChartProps) {
  return (
    <div aria-hidden="true" data-slot="chart-loading" className={className}>
      <LineChart
        className="opacity-25 motion-safe:animate-pulse motion-reduce:animate-none"
        data={simulateChartData()}
        lines={loadingLineSeries}
        height={height}
        width={width}
      />
    </div>
  );
}

export { LineChart, LoadingLineChart };
