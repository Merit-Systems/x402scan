import type { AreaProps } from 'recharts';
import type { ChartProps, Series } from '../types';

export type Area<T extends Record<string, number>> = Series<T, AreaProps>;

export type AreaChartProps<T extends Record<string, number>> = {
  areas: Area<T>[];
} & ChartProps<T>;
