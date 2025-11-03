import type { ChartProps } from '../types';
import type { Bar } from '../bar/types';
import type { Area } from '../area/types';
import type { Line } from '../line/types';

export interface ComposedChartProps<T extends Record<string, number>>
  extends ChartProps<T> {
  bars: Array<Bar<T>>;
  areas: Array<Area<T>>;
  lines: Array<Line<T>>;
}
