'use client';

import { useChain } from '@/app/_contexts/chain/hook';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { LoadingMultiCharts, MultiCharts } from '@/components/ui/charts/multi';
import { facilitators } from '@/lib/facilitators';

import { formatTokenAmount } from '@/lib/token';
import { createTab } from '@/lib/charts';
import { api } from '@/trpc/client';

type FacilitatorKey = `${string}-${'transactions' | 'amount'}`;

export const FacilitatorsChart = () => {
  const { chain } = useChain();
  const { startDate, endDate } = useTimeRangeContext();

  const [bucketedFacilitatorData] =
    api.public.facilitators.bucketedStatistics.useSuspenseQuery({
      numBuckets: 48,
      startDate,
      endDate,
      chain,
    });
  const [overallData] = api.public.stats.overall.useSuspenseQuery({
    startDate,
    endDate,
    chain,
  });

  const chartData: ChartData<Record<FacilitatorKey, number>>[] =
    bucketedFacilitatorData.map(item => ({
      timestamp: item.bucket_start.toISOString(),
      ...Object.entries(item.facilitators).reduce(
        (acc, [facilitator_name, facilitator]) => ({
          ...acc,
          [`${facilitator_name}-transactions`]: facilitator.total_transactions,
          [`${facilitator_name}-amount`]: facilitator.total_amount,
        }),
        {} as Record<FacilitatorKey, number>
      ),
    }));

  const getValueHandler = (
    data: number,
    id: string,
    allData: Record<FacilitatorKey, number>
  ) => {
    const total = facilitators.reduce(
      (sum, facilitator) =>
        sum + (allData[`${facilitator.id}-${id}` as FacilitatorKey] || 0),
      0
    );
    const percentage = total > 0 ? (data / total) * 100 : 0;
    return `${percentage.toFixed(1)}%`;
  };

  return (
    <div className="flex flex-col gap-4">
      <MultiCharts
        chartData={chartData}
        tabs={[
          createTab<
            Record<FacilitatorKey, number>,
            (typeof facilitators)[number]
          >({
            label: 'Transactions',
            amount: overallData.total_transactions.toLocaleString(),
            items: facilitators,
            getValue: (
              data: number,
              dataType: string,
              allData: Record<FacilitatorKey, number>
            ) => getValueHandler(data, dataType, allData),
            getKey: f => f.id,
          }),
          createTab<
            Record<FacilitatorKey, number>,
            (typeof facilitators)[number]
          >({
            label: 'Amount',
            amount: formatTokenAmount(BigInt(overallData.total_amount)),
            items: facilitators,
            getValue: (
              data: number,
              dataType: string,
              allData: Record<FacilitatorKey, number>
            ) => getValueHandler(data, dataType, allData),
            getKey: f => f.id,
          }),
        ]}
      />
    </div>
  );
};

export const LoadingFacilitatorsChart = () => {
  return (
    <LoadingMultiCharts
      tabs={[
        {
          type: 'bar',
          label: 'Transactions',
        },
        {
          type: 'bar',
          label: 'Amount',
        },
      ]}
    />
  );
};
