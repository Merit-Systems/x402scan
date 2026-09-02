"use client";

import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { AreaChart, LoadingAreaChart } from "./chart/area";
import { BarChart, LoadingBarChart } from "./chart/bar";
import { ComposedChart, LoadingComposedChart } from "./chart/composed";
import { LineChart, LoadingLineChart } from "./chart/line";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type {
  BaseChartProps,
  ChartData,
  ChartDimension,
  ChartItems,
  ChartValues,
} from "./chart/types";
import type { ReactNode } from "react";

type StatsCardProps<T extends ChartValues> = Pick<
  BaseChartProps<T>,
  "formatTooltipLabel" | "tooltipRows" | "width"
> & {
  title: ReactNode;
  value: ReactNode;
  data: ChartData<T>[];
  items: ChartItems<T>;
  chartClassName?: string;
  className?: string;
  headerClassName?: string;
  height?: ChartDimension;
};

interface LoadingStatsCardProps {
  title: ReactNode;
  type: ChartItems<ChartValues>["type"];
  chartClassName?: string;
  className?: string;
  headerClassName?: string;
  height?: ChartDimension;
  width?: ChartDimension;
}

function StatsCard<T extends ChartValues>({
  chartClassName,
  className,
  data,
  formatTooltipLabel,
  headerClassName,
  height,
  items,
  title,
  tooltipRows,
  value,
  width = "100%",
}: StatsCardProps<T>) {
  const chartProps = {
    className: chartClassName,
    data,
    formatTooltipLabel,
    height: "100%" as const,
    tooltipCursor: false,
    tooltipRows,
    width,
  };

  return (
    <StatsCardContainer
      className={className}
      headerClassName={headerClassName}
      title={title}
      value={<div className="type-banner-metric">{value}</div>}
    >
      <StatsChartFrame height={height}>
        {items.type === "area" ? (
          <AreaChart {...chartProps} areas={items.areas} />
        ) : items.type === "bar" ? (
          <BarChart
            {...chartProps}
            bars={items.bars}
            solid={items.solid}
            stacked={items.stacked}
          />
        ) : items.type === "line" ? (
          <LineChart {...chartProps} lines={items.lines} />
        ) : (
          <ComposedChart
            {...chartProps}
            areas={items.areas}
            bars={items.bars}
            lines={items.lines}
          />
        )}
      </StatsChartFrame>
    </StatsCardContainer>
  );
}

function LoadingStatsCard({
  chartClassName,
  className,
  headerClassName,
  height,
  title,
  type,
  width = "100%",
}: LoadingStatsCardProps) {
  return (
    <StatsCardContainer
      className={className}
      headerClassName={headerClassName}
      title={title}
      value={<Skeleton className="my-0.5 h-6 w-20" />}
    >
      <StatsChartFrame height={height}>
        {type === "area" ? (
          <LoadingAreaChart
            className={chartClassName}
            height="100%"
            width={width}
          />
        ) : type === "bar" ? (
          <LoadingBarChart
            className={chartClassName}
            height="100%"
            width={width}
          />
        ) : type === "line" ? (
          <LoadingLineChart
            className={chartClassName}
            height="100%"
            width={width}
          />
        ) : (
          <LoadingComposedChart
            className={chartClassName}
            height="100%"
            width={width}
          />
        )}
      </StatsChartFrame>
    </StatsCardContainer>
  );
}

function StatsChartFrame({
  children,
  height,
}: {
  children: ReactNode;
  height?: ChartDimension;
}) {
  return (
    <div
      data-slot="stats-card-chart"
      className={cn("w-full", height === undefined && "h-16 md:h-25")}
      style={height === undefined ? undefined : { height }}
    >
      {children}
    </div>
  );
}

function StatsCardContainer({
  children,
  className,
  headerClassName,
  title,
  value,
}: {
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  title: ReactNode;
  value: ReactNode;
}) {
  return (
    <Card data-slot="stats-card" className={className}>
      <CardHeader className={cn("gap-0", headerClassName)}>
        <CardDescription>{title}</CardDescription>
        {value}
      </CardHeader>
      {children}
    </Card>
  );
}

export { LoadingStatsCard, StatsCard };
export type { LoadingStatsCardProps, StatsCardProps };
