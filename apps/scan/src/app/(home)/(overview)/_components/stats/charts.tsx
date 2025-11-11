'use client';

import { api } from '@/trpc/client';

import { differenceInSeconds, subSeconds } from 'date-fns';

import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';

import { LoadingOverallStatsCard, OverallStatsCard } from './card';

import { getPercentageFromBigInt } from '@/lib/utils';
import { convertTokenAmount, formatTokenAmount } from '@/lib/token';

import type { ChartData } from '@/components/ui/charts/chart/types';
import { ActivityTimeframe } from '@/types/timeframes';
import { useChain } from '@/app/_contexts/chain/hook';

// Check if timeframe can use materialized views
const canUseMV = (timeframe: ActivityTimeframe): boolean => {
  return [
    ActivityTimeframe.OneDay,
    ActivityTimeframe.SevenDays,
    ActivityTimeframe.FifteenDays,
    ActivityTimeframe.ThirtyDays,
  ].includes(timeframe);
};

export const OverallCharts = () => {
  const { startDate, endDate, timeframe } = useTimeRangeContext();
  const { chain } = useChain();

  const useMV = canUseMV(timeframe);

  const [overallStats] = useMV
    ? api.public.stats.overallMv.useSuspenseQuery({
        chain,
        timeframe,
      })
    : api.public.stats.overall.useSuspenseQuery({
        chain,
        startDate,
        endDate,
      });

  // For comparison, always use the original query with previous period dates
  const [previousOverallStats] = api.public.stats.overall.useSuspenseQuery({
    chain,
    startDate: subSeconds(startDate, differenceInSeconds(endDate, startDate)),
    endDate: startDate,
  });

  const [bucketedStats] = useMV
    ? api.public.stats.bucketedMv.useSuspenseQuery({
        chain,
        timeframe,
        startDate,
        endDate,
        numBuckets: 48,
      })
    : api.public.stats.bucketed.useSuspenseQuery({
        numBuckets: 48,
        startDate,
        endDate,
        chain,
      });

  const chartData: ChartData<{
    transactions: number;
    totalAmount: number;
    buyers: number;
    sellers: number;
  }>[] = bucketedStats.map(stat => ({
    transactions: stat.total_transactions,
    totalAmount: parseFloat(
      convertTokenAmount(BigInt(stat.total_amount)).toString()
    ),
    buyers: stat.unique_buyers,
    sellers: stat.unique_sellers,
    timestamp: stat.bucket_start.toISOString(),
  }));

  return (
    <>
      <OverallStatsCard
        title="Transactions"
        value={overallStats.total_transactions.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        percentageChange={
          timeframe === ActivityTimeframe.AllTime
            ? undefined
            : getPercentageFromBigInt(
                BigInt(previousOverallStats.total_transactions),
                BigInt(overallStats.total_transactions)
              )
        }
        items={{
          type: 'bar',
          bars: [{ dataKey: 'transactions', color: 'var(--color-primary)' }],
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
        percentageChange={
          timeframe === ActivityTimeframe.AllTime
            ? undefined
            : getPercentageFromBigInt(
                BigInt(previousOverallStats.total_amount),
                BigInt(overallStats.total_amount)
              )
        }
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
        percentageChange={
          timeframe === ActivityTimeframe.AllTime
            ? undefined
            : getPercentageFromBigInt(
                BigInt(previousOverallStats.unique_buyers),
                BigInt(overallStats.unique_buyers)
              )
        }
        items={{
          type: 'bar',
          bars: [{ dataKey: 'buyers', color: 'var(--color-primary)' }],
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
        percentageChange={
          timeframe === ActivityTimeframe.AllTime
            ? undefined
            : getPercentageFromBigInt(
                BigInt(previousOverallStats.unique_sellers),
                BigInt(overallStats.unique_sellers)
              )
        }
        items={{
          type: 'bar',
          bars: [{ dataKey: 'sellers', color: 'var(--color-primary)' }],
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
      <LoadingOverallStatsCard type="bar" title="Transactions" />
      <LoadingOverallStatsCard type="area" title="Volume" />
      <LoadingOverallStatsCard type="bar" title="Buyers" />
      <LoadingOverallStatsCard type="bar" title="Sellers" />
    </>
  );
};
