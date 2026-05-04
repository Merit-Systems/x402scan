'use client';

import { api } from '@/trpc/client';

import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { useChartMode } from '@/app/(app)/_contexts/chart-mode/hook';

import { LoadingOverallStatsCard, OverallStatsCard } from './card';

import { convertTokenAmount, formatTokenAmount } from '@/lib/token';

import type { ChartData, ChartItems } from '@/components/ui/charts/chart/types';
import { useChain } from '@/app/(app)/_contexts/chain/hook';

type StatRow = {
  transactions: number;
  totalAmount: number;
  buyers: number;
  sellers: number;
};

export const OverallCharts = () => {
  const { timeframe } = useTimeRangeContext();
  const { chain } = useChain();
  const { chartMode } = useChartMode();

  const [overallStats] = api.public.stats.overall.useSuspenseQuery({
    chain,
    timeframe,
  });

  const [bucketedStats] = api.public.stats.bucketed.useSuspenseQuery({
    numBuckets: 48,
    timeframe,
    chain,
  });

  // Cumulative running totals across the time window. Note: buyers/sellers
  // are NOT true uniques in this mode — they sum per-bucket uniques, so a
  // returning buyer is double-counted. Acceptable for visual exploration.
  let txSum = 0;
  let amountSum = 0;
  let buyersSum = 0;
  let sellersSum = 0;
  const chartData: ChartData<StatRow>[] = bucketedStats.map(stat => {
    const txValue = stat.total_transactions;
    const amountValue = parseFloat(
      convertTokenAmount(BigInt(stat.total_amount)).toString()
    );
    const buyersValue = stat.unique_buyers;
    const sellersValue = stat.unique_sellers;

    txSum += txValue;
    amountSum += amountValue;
    buyersSum += buyersValue;
    sellersSum += sellersValue;

    return {
      transactions: chartMode === 'cumulative' ? txSum : txValue,
      totalAmount: chartMode === 'cumulative' ? amountSum : amountValue,
      buyers: chartMode === 'cumulative' ? buyersSum : buyersValue,
      sellers: chartMode === 'cumulative' ? sellersSum : sellersValue,
      timestamp: stat.bucket_start.toISOString(),
    };
  });

  // Per-bucket uses bars for counts (transactions/buyers/sellers) and an area
  // for volume. Cumulative uses areas for everything since the line is
  // monotonically increasing.
  const isCumulative = chartMode === 'cumulative';
  const buildItems = (dataKey: keyof StatRow): ChartItems<StatRow> =>
    isCumulative
      ? {
          type: 'area',
          areas: [{ dataKey, color: 'var(--color-primary)' }],
        }
      : {
          type: 'bar',
          bars: [{ dataKey, color: 'var(--color-primary)' }],
        };
  const txItems = buildItems('transactions');
  const buyersItems = buildItems('buyers');
  const sellersItems = buildItems('sellers');

  return (
    <>
      <OverallStatsCard
        title="Transactions"
        value={overallStats.total_transactions.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={txItems}
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
        items={buyersItems}
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
        items={sellersItems}
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
