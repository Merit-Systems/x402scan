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
  const { timeframe } = useTimeRangeContext();

  const [bucketedFacilitatorData] =
    api.public.facilitators.bucketedStatistics.useSuspenseQuery({
      numBuckets: 48,
      timeframe,
      chain,
    });
  const [overallData] = api.public.stats.overallMV.useSuspenseQuery({
    timeframe,
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
        sum + (allData[`${facilitator.id}-${id}` as FacilitatorKey] ?? 0),
      0
    );
    const percentage = total > 0 ? (data / total) * 100 : 0;
    return `${percentage.toFixed(1)}%`;
  };

  // Calculate totals for each facilitator
  const facilitatorTotals = facilitators.map(facilitator => {
    const transactions = bucketedFacilitatorData.reduce(
      (sum, item) =>
        sum + (item.facilitators[facilitator.id]?.total_transactions ?? 0),
      0
    );
    const amount = bucketedFacilitatorData.reduce(
      (sum, item) =>
        sum + (item.facilitators[facilitator.id]?.total_amount ?? 0),
      0
    );
    return {
      facilitator,
      transactions,
      amount,
    };
  });

  // Filter out facilitators with less than 100 transactions
  const MIN_TRANSACTIONS = 100;
  const filteredFacilitators = facilitatorTotals.filter(
    f => f.transactions >= MIN_TRANSACTIONS
  );

  // Sort facilitators by total transactions (biggest first)
  const facilitatorsByTransactions = [...filteredFacilitators].sort(
    (a, b) => b.transactions - a.transactions
  );

  // Sort facilitators by total amount (biggest first)
  const facilitatorsByAmount = [...filteredFacilitators].sort(
    (a, b) => b.amount - a.amount
  );

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
            items: facilitatorsByTransactions.map(f => f.facilitator),
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
            items: facilitatorsByAmount.map(f => f.facilitator),
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
