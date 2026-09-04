"use client";

import { BarChart, LoadingBarChart } from "@/components/ui/chart";

import type {
  BarSeries,
  ChartData,
  ChartDimension,
  ChartTooltipRow,
} from "@/components/ui/chart";

type UsageChartKey = `${string}-transactions`;
type UsageChartValues = Record<UsageChartKey, number>;

interface UsageBarChartProps {
  bars: BarSeries<UsageChartValues>[];
  chartData: ChartData<UsageChartValues>[];
  height?: ChartDimension;
  tooltipRows: ChartTooltipRow<UsageChartValues>[];
}

interface UsageBarChartItem {
  color: string;
  name: string;
}

interface CreateUsageBarChartModelOptions<TItem extends UsageBarChartItem> {
  chartData: ChartData<UsageChartValues>[];
  formatValue: (value: number, total: number) => string;
  getKey: (item: TItem) => UsageChartKey;
  items: TItem[];
}

const ITEM_LIMIT = 3;
const OTHER_KEY = "other-transactions";
const OTHER_COLOR = "var(--color-muted-foreground)";

function formatTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function UsageBarChart({
  bars,
  chartData,
  height = 210,
  tooltipRows,
}: UsageBarChartProps) {
  return (
    <BarChart
      data={chartData}
      bars={bars}
      formatTooltipLabel={formatTimestamp}
      height={height}
      tooltipRows={tooltipRows}
    />
  );
}

function createUsageBarChartModel<TItem extends UsageBarChartItem>(
  options: CreateUsageBarChartModelOptions<TItem>
) {
  const visibleItems = options.items.slice(0, ITEM_LIMIT);
  const otherItems = options.items.slice(ITEM_LIMIT);
  const visibleKeys = visibleItems.map(options.getKey);
  const otherKeys = otherItems.map(options.getKey);
  const hasOther = otherItems.length > 0;
  const seriesItems = visibleItems.map((item) => ({
    color: item.color,
    key: options.getKey(item),
    name: item.name,
  }));

  if (hasOther) {
    seriesItems.push({ color: OTHER_COLOR, key: OTHER_KEY, name: "Other" });
  }

  const chartData = options.chartData.map((point) => {
    const values = Object.fromEntries(
      visibleKeys.map((key) => [key, point[key] ?? 0])
    );

    if (hasOther) {
      values[OTHER_KEY] = otherKeys.reduce(
        (total, key) => total + (point[key] ?? 0),
        0
      );
    }

    return { timestamp: point.timestamp, ...values };
  });

  const seriesKeys = seriesItems.map((item) => item.key);

  return {
    chartData,
    // Copy-then-reverse: toReversed() needs lib es2023, above this repo's
    // es2022 target, and the spread already protects the original array.
    // oxlint-disable-next-line unicorn/no-array-reverse
    bars: [...seriesItems].reverse().map((item) => ({
      color: item.color,
      dataKey: item.key,
      name: item.name,
    })),
    tooltipRows: seriesItems.map((item) => ({
      color: item.color,
      dataKey: item.key,
      formatValue: (value: number, allData: UsageChartValues) => {
        const total = seriesKeys.reduce(
          (sum, key) => sum + (allData[key] ?? 0),
          0
        );
        return options.formatValue(value, total);
      },
      label: item.name,
    })),
  };
}

function LoadingUsageBarChart({ height = 210 }: { height?: ChartDimension }) {
  return <LoadingBarChart height={height} />;
}

export { createUsageBarChartModel, LoadingUsageBarChart, UsageBarChart };
export type { UsageChartValues };
