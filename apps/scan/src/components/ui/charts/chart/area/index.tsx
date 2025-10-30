'use client';

import { useMemo } from 'react';

import { Area } from 'recharts';

import { BaseChart } from '../chart';

import { simulateChartData } from '../simulate';

import type { AreaChartProps } from './types';

export const BaseAreaChart = <
  T extends Omit<Record<string, number>, 'timestamp'>,
>({
  data,
  children,
  tooltipRows,
  areas,
  height = 350,
  margin = { top: 4, right: 0, left: 0, bottom: 4 },
  dataMax,
}: AreaChartProps<T>) => {
  return (
    <BaseChart
      type="area"
      data={data}
      height={height}
      tooltipRows={tooltipRows}
      margin={margin}
      dataMax={dataMax}
    >
      <defs>
        {areas.map(({ dataKey, color }) => (
          <linearGradient
            key={dataKey as string}
            id={`${dataKey as string}-gradient`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        ))}
      </defs>
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      {areas.map(({ dataKey, color, ref, ...areaProps }, index) => {
        return (
          <Area
            key={dataKey as string}
            isAnimationActive={index === areas.length - 1}
            dataKey={dataKey as string}
            stackId="1"
            fill={`url(#${dataKey as string}-gradient)`}
            stroke={color}
            strokeWidth={1}
            type="monotone"
            {...areaProps}
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
    <div className="animate-pulse" style={{ height }}>
      <BaseAreaChart
        data={simulatedData}
        areas={[
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
