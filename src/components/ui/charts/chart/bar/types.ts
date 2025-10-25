import type { BarProps } from 'recharts';
import type { ChartProps, Series } from '../types';

export type Bar<T extends Record<string, number>> = Series<T, BarProps>;

export type StackOffset = 'expand' | 'none' | 'wiggle' | 'silhouette';

export interface BarChartProps<T extends Record<string, number>>
  extends ChartProps<T> {
  bars: Array<Bar<T>>;
  stacked?: boolean;
  solid?: boolean;
  stackOffset?: StackOffset;
}
