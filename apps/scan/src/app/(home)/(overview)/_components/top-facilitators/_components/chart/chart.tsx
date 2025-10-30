'use client';

import {
  BaseAreaChart,
  LoadingAreaChart,
} from '@/components/ui/charts/chart/area';

import type { ChartData } from '@/components/ui/charts/chart/types';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { facilitators } from '@/lib/facilitators';

export const FacilitatorChartContent = ({
  chartData,
  total_transactions,
}: {
  chartData: ChartData<{
    total_transactions: number;
  }>[];
  total_transactions: number;
}) => {
  const isMobile = useIsMobile();

  return (
    <BaseAreaChart
      data={chartData}
      areas={[{ dataKey: 'total_transactions', color: 'var(--color-primary)' }]}
      height={isMobile ? 64 : '100%'}
      dataMax={total_transactions / 48 / facilitators.length}
    />
  );
};

export const LoadingFacilitatorChartContent = () => {
  const isMobile = useIsMobile();
  return <LoadingAreaChart height={isMobile ? 64 : '100%'} />;
};
