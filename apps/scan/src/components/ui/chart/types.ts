import type {
  AreaProps as RechartsAreaProps,
  BarProps as RechartsBarProps,
  DataKey,
  LineProps as RechartsLineProps,
} from "recharts";
import type { AxisDomain } from "recharts/types/util/types";

import type { ReactNode } from "react";

type ChartValues = object;

type ChartData<T extends ChartValues> = {
  timestamp: string;
} & T;

type ChartDimension = number | `${number}%`;

interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface ChartTooltipRow<T extends ChartValues, K extends keyof T = keyof T> {
  dataKey: K;
  label: ReactNode;
  formatValue: (value: T[K], data: ChartData<T>) => ReactNode;
  color?: string;
  labelClassName?: string;
  valueClassName?: string;
}

interface ChartXAxis<T extends ChartValues> {
  show?: boolean;
  dataKey?: DataKey<ChartData<T>, string | number> &
    keyof ChartData<T> &
    string;
  angle?: number;
  height?: number;
  tickFormatter?: (value: string, index: number) => string;
}

interface ChartYAxis {
  id?: number | string;
  domain?: AxisDomain;
  hide?: boolean;
  tickFormatter?: (value: number, index: number) => string;
}

type StackOffset = "expand" | "none" | "silhouette" | "wiggle";

interface BaseChartProps<T extends ChartValues> {
  data: ChartData<T>[];
  children?: ReactNode;
  className?: string;
  height?: ChartDimension;
  width?: ChartDimension;
  margin?: ChartMargin;
  dataMax?: number | string;
  stackOffset?: StackOffset;
  tooltipRows?: ChartTooltipRow<T>[];
  tooltipCursor?: boolean;
  formatTooltipLabel?: (timestamp: string, data: ChartData<T>) => ReactNode;
  xAxis?: ChartXAxis<T>;
  yAxes?: ChartYAxis[];
}

type ChartSeries<T extends ChartValues, TProps> = Omit<
  TProps,
  "dataKey" | "fill" | "stroke"
> & {
  dataKey: DataKey<ChartData<T>, number> & keyof T & string;
  color: string;
};

type AreaSeries<T extends ChartValues> = ChartSeries<
  T,
  RechartsAreaProps<ChartData<T>, number>
>;
type BarSeries<T extends ChartValues> = ChartSeries<
  T,
  RechartsBarProps<ChartData<T>, number>
>;
type LineSeries<T extends ChartValues> = ChartSeries<
  T,
  RechartsLineProps<ChartData<T>, number>
>;

type AreaChartProps<T extends ChartValues> = BaseChartProps<T> & {
  areas: AreaSeries<T>[];
};

type BarChartProps<T extends ChartValues> = BaseChartProps<T> & {
  bars: BarSeries<T>[];
  solid?: boolean;
  stacked?: boolean;
};

type LineChartProps<T extends ChartValues> = BaseChartProps<T> & {
  lines: LineSeries<T>[];
};

type ComposedChartProps<T extends ChartValues> = BaseChartProps<T> & {
  areas?: AreaSeries<T>[];
  bars?: BarSeries<T>[];
  lines?: LineSeries<T>[];
};

type ChartItems<T extends ChartValues> =
  | { type: "area"; areas: AreaSeries<T>[] }
  | { type: "bar"; bars: BarSeries<T>[]; solid?: boolean; stacked?: boolean }
  | { type: "line"; lines: LineSeries<T>[] }
  | {
      type: "composed";
      areas?: AreaSeries<T>[];
      bars?: BarSeries<T>[];
      lines?: LineSeries<T>[];
    };

interface LoadingChartProps {
  className?: string;
  height?: ChartDimension;
  width?: ChartDimension;
}

export type {
  AreaChartProps,
  AreaSeries,
  BarChartProps,
  BarSeries,
  BaseChartProps,
  ChartData,
  ChartDimension,
  ChartItems,
  ChartMargin,
  ChartTooltipRow,
  ChartValues,
  ChartXAxis,
  ChartYAxis,
  ComposedChartProps,
  LineChartProps,
  LineSeries,
  LoadingChartProps,
  StackOffset,
};
