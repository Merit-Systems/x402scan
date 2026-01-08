import type { ChartProps } from '../types';
import type { Bar } from '../bar/types';
import type { Area } from '../area/types';
import type { Line } from '../line/types';

export type ComposedChartProps<T extends Record<string, number>> = {
  bars: Bar<T>[];
  areas: Area<T>[];
  lines: Line<T>[];
} & ChartProps<T>;
