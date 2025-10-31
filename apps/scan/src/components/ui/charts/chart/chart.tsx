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
}: ChartProps<T> & { type: 'bar' | 'area' | 'line' | 'composed' }) => {
  const getContainer = () => {
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
  };

  const Container = getContainer();

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Container
        data={data}
        margin={margin}
        style={{ cursor: 'pointer' }}
        stackOffset={stackOffset}
      >
        <XAxis
          tickLine={false}
          tick={false}
          axisLine={false}
          interval="preserveEnd"
          height={0}
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
                    data={payload[0].payload as ChartData<T>}
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
