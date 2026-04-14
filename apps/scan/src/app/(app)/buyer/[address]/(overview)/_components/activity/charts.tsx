'use client';

import { format } from 'date-fns';
import { MultiCharts, LoadingMultiCharts } from '@/components/ui/charts/multi';

import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';

import { api } from '@/trpc/client';

import { useMemo } from 'react';
import type { ChartData } from '@/components/ui/charts/chart/types';

interface Props {
  address: string;
}

export const ActivityCharts: React.FC<Props> = ({ address }) => {
  const { timeframe } = useTimeRangeContext();

  const [overallStats] = api.public.buyers.all.stats.overall.useSuspenseQuery({
    senders: {
      include: [address],
    },
    timeframe,
  });
  const [bucketedStats] = api.public.buyers.all.stats.bucketed.useSuspenseQuery(
    {
      senders: {
        include: [address],
      },
      timeframe,
    },
    {
      staleTime: 15000,
      refetchInterval: 15000,
    }
  );

  // Transform data for the chart
  const chartData: ChartData<{
    total_transactions: number;
    unique_sellers: number;
  }>[] = useMemo(() => {
    return bucketedStats.map(({ bucket_start, ...rest }) => ({
      total_transactions: rest.total_transactions,
      unique_sellers: rest.unique_sellers,
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

export const LoadingActivityCharts = () => {
  return (
    <LoadingMultiCharts
      tabs={[
        { type: 'bar', label: 'Transactions' },
        { type: 'bar', label: 'Sellers' },
      ]}
    />
  );
};
