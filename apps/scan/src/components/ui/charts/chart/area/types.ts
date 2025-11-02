import type { AreaProps } from 'recharts';
import type { ChartProps, Series } from '../types';

export type Area<T extends Record<string, number>> = Series<T, AreaProps>;

export interface AreaChartProps<T extends Record<string, number>>
  extends ChartProps<T> {
  areas: Array<Area<T>>;
}
