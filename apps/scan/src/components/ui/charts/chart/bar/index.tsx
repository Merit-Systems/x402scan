'use client';

import { useMemo } from 'react';

import { Bar } from 'recharts';

import { BaseChart } from '../chart';
import { simulateChartData } from '../simulate';

import type { BarChartProps } from './types';

export const BaseBarChart = <
  T extends Omit<Record<string, number>, 'timestamp'>,
>({
  data,
  children,
  tooltipRows,
  bars,
  height = 350,
  stacked = true,
  margin = { top: 4, right: 6, left: 6, bottom: 0 },
  solid = false,
  stackOffset,
}: BarChartProps<T>) => {
  return (
    <BaseChart
      type="bar"
      data={data}
      height={height}
      tooltipRows={tooltipRows}
      margin={margin}
      stackOffset={stackOffset}
    >
      {!solid && (
        <defs>
          {bars.map(({ dataKey, color }) => (
            <linearGradient
              key={dataKey as string}
              id={`${dataKey as string}-gradient`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
      )}

      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      {bars.map(({ dataKey, color, ref, ...barProps }, index) => {
        return (
          <Bar
            key={dataKey as string}
            isAnimationActive={index === bars.length - 1}
            dataKey={dataKey as string}
            stackId={stacked ? '1' : index.toString()}
            fill={solid ? color : `url(#${dataKey as string}-gradient)`}
            fillOpacity={solid ? 0.2 : undefined}
            stroke={color}
            strokeWidth={0.5}
            radius={
              index === bars.length - 1 || !stacked ? [4, 4, 0, 0] : undefined
            }
            {...barProps}
          />
        );
      })}
      {children}
    </BaseChart>
  );
};

export const LoadingBarChart = ({
  height = 350,
}: {
  height?: number | string;
}) => {
  const simulatedData = useMemo(simulateChartData, []);

  return (
    <div className="animate-pulse">
      <BaseBarChart
        data={simulatedData}
        bars={[
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
