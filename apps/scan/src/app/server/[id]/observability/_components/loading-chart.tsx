'use client';

import { useMemo } from 'react';
import { BaseChart } from '@/components/ui/charts/chart/chart';
import { Area } from 'recharts';
import { simulateChartData } from '@/components/ui/charts/chart/simulate';

interface LegendItem {
  label: string;
}

interface Props {
  legendItems: LegendItem[];
}

export const LoadingChart: React.FC<Props> = ({ legendItems }) => {
  const simulatedData = useMemo(() => simulateChartData({ days: 48 }), []);

  return (
    <div className="w-1/2 animate-pulse">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold"></h2>
        <div className="flex gap-3">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-xs text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <BaseChart
        type="composed"
        data={simulatedData}
        height={200}
        margin={{ top: 0, right: 0, left: 0, bottom: 20 }}
        yAxes={[
          {
            domain: [0, 'dataMax'],
            hide: false,
          },
        ]}
        xAxis={{
          show: false,
          height: 0,
        }}
      >
        <Area
          type="monotone"
          dataKey="value"
          stroke="color-mix(in oklab, var(--color-neutral-500) 20%, transparent)"
          fill="color-mix(in oklab, var(--color-neutral-500) 20%, transparent)"
          strokeWidth={2}
          yAxisId={0}
          isAnimationActive={false}
        />
      </BaseChart>
    </div>
  );
};
