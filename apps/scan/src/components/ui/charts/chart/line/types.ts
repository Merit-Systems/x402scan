import type { LineProps } from 'recharts';

import type { ChartProps, Series } from '../types';

export type Line<T extends Record<string, number>> = Series<T, LineProps>;

export interface AreaChartProps<T extends Record<string, number>>
  extends ChartProps<T> {
  lines: Array<Line<T>>;
}
