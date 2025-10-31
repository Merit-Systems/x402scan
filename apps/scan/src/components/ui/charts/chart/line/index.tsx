import { useMemo } from 'react';

import { Line } from 'recharts';

import { BaseChart } from '../chart';

import { simulateChartData } from '../simulate';

import type { AreaChartProps } from './types';

export const BaseLineChart = <
  T extends Omit<Record<string, number>, 'timestamp'>,
>({
  data,
  children,
  tooltipRows,
  lines,
  height = 350,
  margin = { top: 4, right: 0, left: 0, bottom: 0 },
}: AreaChartProps<T>) => {
  return (
    <BaseChart
      type="line"
      data={data}
      height={height}
      tooltipRows={tooltipRows}
      margin={margin}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      {lines.map(({ dataKey, color, ref, ...lineProps }, index) => {
        return (
          <Line
            key={dataKey as string}
            isAnimationActive={index === lines.length - 1}
            dataKey={dataKey as string}
            fill={`color-mix(in oklab, ${color} 40%, transparent)`}
            stroke={color}
            type="monotone"
            {...lineProps}
          />
        );
      })}
      {children}
    </BaseChart>
  );
};

export const LoadingAreaChart = ({
  height = 350,
}: {
  height?: number | string;
}) => {
  const simulatedData = useMemo(simulateChartData, []);

  return (
    <div className="animate-pulse">
      <BaseLineChart
        data={simulatedData}
        lines={[
          {
            dataKey: 'value',
            color:
              'color-mix(in oklab, var(--color-neutral-500) 20%, transparent)',
            isAnimationActive: false,
          },
        ]}
        height={height}
      />
    </div>
  );
};
