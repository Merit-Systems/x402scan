import {
  FacilitatorChartContent,
  LoadingFacilitatorChartContent,
} from './chart';

import type { ChartData } from '@/components/ui/charts/chart/types';

interface Props {
  chartData: ChartData<{
    total_transactions: number;
  }>[];
  total_transactions: number;
}

export const FacilitatorChart: React.FC<Props> = ({
  chartData,
  total_transactions,
}) => {
  return (
    <FacilitatorChartContent
      chartData={chartData}
      total_transactions={total_transactions}
    />
  );
};

export const LoadingFacilitatorChart = () => {
  return <LoadingFacilitatorChartContent />;
};
