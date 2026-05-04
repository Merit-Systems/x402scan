'use client';

import { api } from '@/trpc/client';

import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';

import { LoadingOverallStatsCard, OverallStatsCard } from './card';

import { convertTokenAmount, formatTokenAmount } from '@/lib/token';

import type { ChartData } from '@/components/ui/charts/chart/types';
import { useChain } from '@/app/(app)/_contexts/chain/hook';

export const OverallCharts = () => {
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();

  const [overallStats] = api.public.stats.overall.useSuspenseQuery({
    chain,
    timeframe,
  });

  const [bucketedStats] = api.public.stats.bucketed.useSuspenseQuery({
    numBuckets: 48,
    timeframe,
    chain,
  });

  // Experimental: render cumulative running totals across the time window
  // instead of per-bucket. Note buyers/sellers are NOT true uniques across
  // the cumulative window — they sum per-bucket uniques, so a returning
  // buyer is double-counted. Acceptable for visual exploration.
  let txSum = 0;
  let amountSum = 0;
  let buyersSum = 0;
  let sellersSum = 0;
  const chartData: ChartData<{
    transactions: number;
    totalAmount: number;
    buyers: number;
    sellers: number;
  }>[] = bucketedStats.map(stat => {
    txSum += stat.total_transactions;
    amountSum += parseFloat(
      convertTokenAmount(BigInt(stat.total_amount)).toString()
    );
    buyersSum += stat.unique_buyers;
    sellersSum += stat.unique_sellers;
    return {
      transactions: txSum,
      totalAmount: amountSum,
      buyers: buyersSum,
      sellers: sellersSum,
      timestamp: stat.bucket_start.toISOString(),
    };
  });

  return (
    <>
      <OverallStatsCard
        title="Transactions"
        value={overallStats.total_transactions.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={{
          type: 'area',
          areas: [{ dataKey: 'transactions', color: 'var(--color-primary)' }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: 'transactions',
            label: 'Transactions',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
          },
        ]}
      />
      <OverallStatsCard
        title="Volume"
        value={formatTokenAmount(BigInt(overallStats.total_amount))}
        items={{
          type: 'area',
          areas: [{ dataKey: 'totalAmount', color: 'var(--color-primary)' }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: 'totalAmount',
            label: 'Volume',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                style: 'currency',
                currency: 'USD',
              }),
          },
        ]}
      />
      <OverallStatsCard
        title="Buyers"
        value={overallStats.unique_buyers.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={{
          type: 'area',
          areas: [{ dataKey: 'buyers', color: 'var(--color-primary)' }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: 'buyers',
            label: 'Buyers',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }),
          },
        ]}
      />
      <OverallStatsCard
        title="Sellers"
        value={overallStats.unique_sellers.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
        items={{
          type: 'area',
          areas: [{ dataKey: 'sellers', color: 'var(--color-primary)' }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: 'sellers',
            label: 'Sellers',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }),
          },
        ]}
      />
    </>
  );
};

export const LoadingOverallCharts = () => {
  return (
    <>
      <LoadingOverallStatsCard type="area" title="Transactions" />
      <LoadingOverallStatsCard type="area" title="Volume" />
      <LoadingOverallStatsCard type="area" title="Buyers" />
      <LoadingOverallStatsCard type="area" title="Sellers" />
    </>
  );
};
