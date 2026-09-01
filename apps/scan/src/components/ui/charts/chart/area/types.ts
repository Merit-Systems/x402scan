import type { AreaProps } from "recharts";
import type { ChartData, ChartProps, Series } from "../types";

export type Area<T extends Record<string, number>> = Series<
  T,
  AreaProps<ChartData<T>, number>
>;

export type AreaChartProps<T extends Record<string, number>> = {
  areas: Area<T>[];
} & ChartProps<T>;
