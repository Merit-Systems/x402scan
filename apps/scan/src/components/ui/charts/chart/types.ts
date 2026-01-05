import type { AxisDomain } from 'recharts/types/util/types';
import type { BarChartProps, StackOffset } from './bar/types';
import type { AreaChartProps } from './area/types';

export type TooltipRowProps<
  T extends Record<string, number>,
  K extends keyof T = keyof T,
> = {
  key: K;
  label: string;
  getValue: (data: T[K], allData: T) => string;
  labelClassName?: string;
  valueClassName?: string;
  dotColor?: string;
};

export type ChartData<T extends Record<string, number>> = {
  timestamp: string;
} & T;

export type ChartProps<T extends Record<string, number>> = {
  data: ChartData<T>[];
  children?: React.ReactNode;
  tooltipRows?: TooltipRowProps<T>[];
  height?: number | string;
  margin?: { top: number; right: number; left: number; bottom: number };
  yAxes?: {
    domain: AxisDomain;
    hide: boolean;
  }[];
  dataMax?: number | string;
  stackOffset?: StackOffset;
  xAxis?: {
    show?: boolean;
    dataKey?: string;
    angle?: number;
    height?: number;
  };
};

export type Series<T extends Record<string, number>, S> = S & {
  yAxisId?: number;
  dataKey: keyof T;
  color: string;
};

export type ChartItems<T extends Record<string, number>> =
  | {
      type: 'bar';
      bars: BarChartProps<T>['bars'];
    }
  | {
      type: 'area';
      areas: AreaChartProps<T>['areas'];
    };
