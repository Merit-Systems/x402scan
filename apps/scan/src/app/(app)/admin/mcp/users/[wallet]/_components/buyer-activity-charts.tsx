'use client';

import { format } from 'date-fns';
import { useMemo } from 'react';

import { MultiCharts, LoadingMultiCharts } from '@/components/ui/charts/multi';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';
import { api } from '@/trpc/client';
import { convertTokenAmount, formatTokenAmount } from '@/lib/token';

import type { ChartData } from '@/components/ui/charts/chart/types';

interface Props {
  wallet: string;
}

export const BuyerActivityCharts: React.FC<Props> = ({ wallet }) => {
  const { timeframe } = useTimeRangeContext();

  const [overallStats] = api.admin.users.buyerStats.useSuspenseQuery({
    wallet,
    timeframe,
  });

  // Convert timeframe to number for bucketed query
  const timeframePeriod =
    typeof timeframe === 'number'
      ? timeframe
      : (timeframe as { period: number }).period;

  const [bucketedStats] = api.admin.users.buyerStatsBucketed.useSuspenseQuery(
    {
      wallet,
      timeframe: timeframePeriod,
    },
    {
      staleTime: 15000,
      refetchInterval: 15000,
    }
  );

  // Transform data for the chart, converting raw token amounts to human-readable
  const chartData: ChartData<{
    total_transactions: number;
    total_amount: number;
    unique_sellers: number;
  }>[] = useMemo(() => {
    return bucketedStats.map(({ bucket_start, ...rest }) => ({
      total_transactions: rest.total_transactions,
      // Convert from raw token amount (6 decimals for USDC) to human-readable
      total_amount: parseFloat(
        convertTokenAmount(BigInt(Math.round(rest.total_amount))).toString()
      ),
      unique_sellers: 0, // Not available in bucketed data
      timestamp: format(bucket_start, 'MMM dd HH:mm yyyy'),
    }));
  }, [bucketedStats]);

  return (
    <MultiCharts
      tabs={[
        {
          trigger: {
            value: 'total_transactions',
            label: 'Transactions',
            amount: Number(overallStats.total_transactions).toLocaleString(
              undefined,
              {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }
            ),
          },
          items: {
            type: 'bar',
            bars: [
              {
                dataKey: 'total_transactions',
                color: 'var(--color-primary)',
              },
            ],
          },
          tooltipRows: [
            {
              key: 'total_transactions',
              label: 'Transactions',
              getValue: data =>
                data.toLocaleString(undefined, {
                  notation: 'compact',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }),
            },
          ],
        },
        {
          trigger: {
            value: 'total_amount',
            label: 'Volume',
            amount: formatTokenAmount(
              BigInt(Math.round(overallStats.total_amount))
            ),
          },
          items: {
            type: 'area',
            areas: [
              {
                dataKey: 'total_amount',
                color: 'var(--color-primary)',
              },
            ],
          },
          tooltipRows: [
            {
              key: 'total_amount',
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
          ],
        },
        {
          trigger: {
            value: 'unique_sellers',
            label: 'Sellers',
            amount: Number(overallStats.unique_sellers).toLocaleString(
              undefined,
              {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }
            ),
          },
          items: {
            type: 'bar',
            bars: [
              {
                dataKey: 'unique_sellers',
                color: 'var(--color-primary)',
              },
            ],
          },
          tooltipRows: [
            {
              key: 'unique_sellers',
              label: 'Sellers',
              getValue: data =>
                data.toLocaleString(undefined, {
                  notation: 'compact',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }),
            },
          ],
        },
      ]}
      chartData={chartData}
    />
  );
};

export const LoadingBuyerActivityCharts = () => {
  return (
    <LoadingMultiCharts
      tabs={[
        { type: 'bar', label: 'Transactions' },
        { type: 'area', label: 'Volume' },
        { type: 'bar', label: 'Sellers' },
      ]}
    />
  );
};
