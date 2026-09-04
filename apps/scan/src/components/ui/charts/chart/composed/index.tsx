"use client";

import { useMemo } from "react";

import { Area, Bar, Line } from "recharts";

import { BaseChart } from "../chart";
import { simulateChartData } from "../simulate";

import type { ComposedChartProps } from "./types";
import type { ChartData, ChartDimension } from "../types";

export const BaseComposedChart = <
  T extends Omit<Record<string, number>, "timestamp">,
>({
  data,
  children,
  tooltipRows,
  bars,
  areas,
  lines,
  height = 350,
  margin = { top: 4, right: 6, left: 6, bottom: 0 },
  yAxes,
}: ComposedChartProps<T>) => {
  return (
    <BaseChart
      type="composed"
      data={data}
      height={height}
      tooltipRows={tooltipRows}
      margin={margin}
      yAxes={yAxes}
    >
      <defs>
        {bars.map(({ dataKey, color }) => (
          <linearGradient
            key={dataKey as string}
            id={`${dataKey as string}-gradient`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity={0.9} />
            <stop offset="100%" stopColor={color} stopOpacity={0.1} />
          </linearGradient>
        ))}
      </defs>
      {bars.map(({ dataKey, color, ...barProps }, index) => {
        return (
          <Bar<ChartData<T>, number>
            key={dataKey as string}
            isAnimationActive={index === bars.length - 1}
            dataKey={dataKey}
            stackId={index.toString()}
            fill={`color-mix(in oklab, ${color} 40%, transparent)`}
            stroke={color}
            radius={[4, 4, 0, 0]}
            {...barProps}
          />
        );
      })}
      <defs>
        {areas.map(({ dataKey, color }) => (
          <linearGradient
            key={dataKey as string}
            id={`${dataKey as string}-gradient`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity={0.9} />
            <stop offset="100%" stopColor={color} stopOpacity={0.1} />
          </linearGradient>
        ))}
      </defs>
      {areas.map(({ dataKey, color, ...areaProps }, index) => {
        return (
          <Area<ChartData<T>, number>
            key={dataKey as string}
            isAnimationActive={index === areas.length - 1}
            dataKey={dataKey}
            stackId="1"
            fill={`color-mix(in oklab, ${color} 40%, transparent)`}
            stroke={color}
            type="monotone"
            {...areaProps}
          />
        );
      })}
      {lines.map(({ dataKey, color, ...lineProps }, index) => {
        return (
          <Line<ChartData<T>, number>
            key={dataKey as string}
            isAnimationActive={index === lines.length - 1}
            dataKey={dataKey}
            fill={`color-mix(in oklab, ${color} 40%, transparent)`}
            stroke={color}
            type="monotone"
            {...lineProps}
          />
        );
      })}
      {children}
    </BaseChart>
  );
};

export const LoadingComposedChart = ({
  height = 350,
}: {
  height?: ChartDimension;
}) => {
  const simulatedData = useMemo(() => simulateChartData(), []);

  return (
    <div className="animate-pulse">
      <BaseComposedChart
        data={simulatedData}
        bars={[]}
        areas={[]}
        lines={[]}
        height={height}
      />
    </div>
  );
};
