import type { LineProps } from 'recharts';

import type { ChartProps, Series } from '../types';

export type Line<T extends Record<string, number>> = Series<T, LineProps>;

export type AreaChartProps<T extends Record<string, number>> = {
  lines: Line<T>[];
} & ChartProps<T>;
