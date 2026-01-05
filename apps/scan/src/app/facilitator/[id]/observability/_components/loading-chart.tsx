'use client';

import { useMemo } from 'react';
import { BaseChart } from '@/components/ui/charts/chart/chart';
import { Area } from 'recharts';
import { simulateChartData } from '@/components/ui/charts/chart/simulate';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

type LegendItem = {
  label: string;
};

type Props = {
  legendItems: LegendItem[];
  title: string;
};

export const LoadingChart: React.FC<Props> = ({ legendItems, title }) => {
  const simulatedData = useMemo(() => simulateChartData({ days: 48 }), []);

  return (
    <Card className="w-full animate-pulse">
      <CardHeader className="space-y-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
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
      </CardHeader>
      <BaseChart
        type="composed"
        data={simulatedData}
        height={120}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        yAxes={[
          {
            domain: [0, 'dataMax'],
            hide: true,
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
    </Card>
  );
};
