'use client';

import { format } from 'date-fns';
import { MultiCharts, LoadingMultiCharts } from '@/components/ui/charts/multi';

import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';

import { api } from '@/trpc/client';

import { useMemo } from 'react';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { convertTokenAmount, formatTokenAmount } from '@/lib/token';

interface Props {
  facilitatorId: string;
}

export const ActivityCharts: React.FC<Props> = ({ facilitatorId }) => {
  const { startDate, endDate } = useTimeRangeContext();

  const [overallStats] = api.public.stats.overall.useSuspenseQuery({
    facilitatorIds: [facilitatorId],
    startDate,
    endDate,
  });
  const [bucketedStats] = api.public.stats.bucketed.useSuspenseQuery(
    {
      facilitatorIds: [facilitatorId],
      startDate,
      endDate,
    },
    {
      staleTime: 15000,
      refetchInterval: 15000,
    }
  );

  // Transform data for the chart
  const chartData: ChartData<{
    total_transactions: number;
    total_amount: number;
    unique_buyers: number;
    unique_sellers: number;
  }>[] = useMemo(() => {
    return bucketedStats.map(({ bucket_start, ...rest }) => ({
      total_transactions: rest.total_transactions,
      total_amount: parseFloat(
        convertTokenAmount(BigInt(rest.total_amount)).toString()
      ),
      unique_buyers: rest.unique_buyers,
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
            value: 'total_amount',
            label: 'Volume',
            amount: formatTokenAmount(BigInt(overallStats.total_amount)),
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
            value: 'unique_buyers',
            label: 'Buyers',
            amount: Number(overallStats.unique_buyers).toLocaleString(
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
                dataKey: 'unique_buyers',
                color: 'var(--color-primary)',
              },
            ],
          },
          tooltipRows: [
            {
              key: 'unique_buyers',
              label: 'Buyers',
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
        { type: 'area', label: 'Volume' },
        { type: 'bar', label: 'Buyers' },
      ]}
    />
  );
};
