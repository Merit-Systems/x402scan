"use client";

import {
  AreaChart,
  BarChart,
  ComposedChart,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

import { ChartTooltipContent } from "./tooltip";

import type { BaseChartProps, ChartData, ChartValues } from "./types";

type ChartType = "area" | "bar" | "composed" | "line";

interface BaseChartComponentProps<
  T extends ChartValues,
> extends BaseChartProps<T> {
  type: ChartType;
}

const defaultMargin = { top: 0, right: 0, bottom: 0, left: 0 };

function getTimestamp<T extends ChartValues>(data: ChartData<T>) {
  return data.timestamp;
}

interface ChartTooltipRendererProps<T extends ChartValues> {
  formatLabel?: BaseChartProps<T>["formatTooltipLabel"];
  payload?: readonly { payload?: ChartData<T> }[];
  rows: NonNullable<BaseChartProps<T>["tooltipRows"]>;
}

function ChartTooltipRenderer<T extends ChartValues>({
  formatLabel,
  payload,
  rows,
}: ChartTooltipRendererProps<T>) {
  const point = payload?.[0]?.payload;

  return point ? (
    <ChartTooltipContent data={point} rows={rows} formatLabel={formatLabel} />
  ) : null;
}

function BaseChart<T extends ChartValues>({
  children,
  className,
  data,
  dataMax = "dataMax",
  formatTooltipLabel,
  height = 350,
  margin = defaultMargin,
  stackOffset,
  tooltipCursor = true,
  tooltipRows,
  type,
  width = "100%",
  xAxis,
  yAxes,
}: BaseChartComponentProps<T>) {
  const singlePoint = data[0];
  const normalizedData =
    data.length === 1 && type !== "bar" && singlePoint
      ? [singlePoint, singlePoint]
      : data;

  const chartContent = (
    <>
      <XAxis<ChartData<T>, string | number>
        angle={xAxis?.angle ?? 0}
        axisLine={false}
        dataKey={xAxis?.dataKey ?? getTimestamp<T>}
        height={xAxis?.height ?? (xAxis?.show ? 40 : 0)}
        interval="preserveEnd"
        textAnchor={xAxis?.angle ? "end" : "middle"}
        tick={
          xAxis?.show
            ? { fill: "var(--color-muted-foreground)", fontSize: 12 }
            : false
        }
        tickFormatter={xAxis?.tickFormatter}
        tickLine={false}
      />
      {yAxes ? (
        yAxes.map((axis, index) => (
          <YAxis<ChartData<T>, number>
            key={axis.id ?? index}
            domain={axis.domain}
            hide={axis.hide ?? false}
            tickFormatter={axis.tickFormatter}
            yAxisId={axis.id ?? index}
          />
        ))
      ) : (
        <YAxis<ChartData<T>, number> domain={[0, dataMax]} hide />
      )}
      {children}
      {tooltipRows?.length ? (
        <Tooltip
          content={
            <ChartTooltipRenderer
              rows={tooltipRows}
              formatLabel={formatTooltipLabel}
            />
          }
          cursor={
            tooltipCursor
              ? {
                  fill: "var(--color-primary)",
                  fillOpacity: 0.12,
                  radius: 4,
                }
              : false
          }
        />
      ) : null}
    </>
  );

  const chartProps = {
    accessibilityLayer: true,
    className: cn(
      "[&_.recharts-surface:focus:not(:focus-visible)]:outline-none",
      className
    ),
    data: normalizedData,
    margin,
    stackOffset,
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      {type === "area" ? (
        <AreaChart {...chartProps}>{chartContent}</AreaChart>
      ) : type === "bar" ? (
        <BarChart {...chartProps}>{chartContent}</BarChart>
      ) : type === "line" ? (
        <LineChart {...chartProps}>{chartContent}</LineChart>
      ) : (
        <ComposedChart {...chartProps}>{chartContent}</ComposedChart>
      )}
    </ResponsiveContainer>
  );
}

export { BaseChart };
export type { BaseChartComponentProps, ChartType };
