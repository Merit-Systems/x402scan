import type { LineProps } from "recharts";

import type { ChartData, ChartProps, Series } from "../types";

export type Line<T extends Record<string, number>> = Series<
  T,
  LineProps<ChartData<T>, number>
>;

export type AreaChartProps<T extends Record<string, number>> = {
  lines: Line<T>[];
} & ChartProps<T>;
