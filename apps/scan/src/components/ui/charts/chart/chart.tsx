import { useMemo } from 'react';
import {
  BarChart,
  LineChart,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
} from 'recharts';

import { TooltipContent } from './tooltip';
import type { ChartData, ChartProps } from './types';

export const BaseChart = <T extends Omit<Record<string, number>, 'timestamp'>>({
  data,
  children,
  type,
  tooltipRows,
  height = 350,
  margin = { top: 0, right: 0, left: 0, bottom: 0 },
  yAxes,
  dataMax = 'dataMax',
  stackOffset,
  xAxis,
}: ChartProps<T> & { type: 'bar' | 'area' | 'line' | 'composed' }) => {
  const Container = useMemo(() => {
    switch (type) {
      case 'bar':
        return BarChart;
      case 'area':
        return AreaChart;
      case 'line':
        return LineChart;
      case 'composed':
        return ComposedChart;
      default:
        return BarChart;
    }
  }, [type]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Container
        data={data}
        margin={margin}
        style={{ cursor: 'pointer' }}
        stackOffset={stackOffset}
      >
        <XAxis
          dataKey={xAxis?.dataKey ?? 'timestamp'}
          tickLine={false}
          tick={
            xAxis?.show
              ? { fontSize: 12, fill: 'hsl(var(--muted-foreground))' }
              : false
          }
          axisLine={false}
          interval="preserveEnd"
          height={xAxis?.height ?? (xAxis?.show ? 40 : 0)}
          angle={xAxis?.angle ?? 0}
          textAnchor={xAxis?.angle ? 'end' : 'middle'}
        />
        {yAxes != undefined ? (
          yAxes.map(({ domain, hide }, index) => (
            <YAxis key={index} domain={domain} hide={hide} yAxisId={index} />
          ))
        ) : (
          <YAxis domain={['0', dataMax]} hide={true} />
        )}
        {children}
        {tooltipRows && (
          <Tooltip
            content={({ payload }) => {
              if (payload?.length) {
                return (
                  <TooltipContent
                    data={payload[0]!.payload as ChartData<T>}
                    rows={tooltipRows}
                  />
                );
              }
              return null;
            }}
            cursor={{
              fill: 'var(--color-primary)',
              opacity: 0.2,
              radius: 4,
            }}
          />
        )}
      </Container>
    </ResponsiveContainer>
  );
};
