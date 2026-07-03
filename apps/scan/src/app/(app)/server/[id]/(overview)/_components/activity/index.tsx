'use client';

import { OriginOverviewSection } from '../section';

import { LoadingOverallStatsCard, OverallStatsCard } from './card';

import { api } from '@/trpc/client';

import { convertTokenAmount, formatTokenAmount } from '@/lib/token';

import { ActivityTimeframe } from '@/types/timeframes';
import { TimeRangeProvider } from '@/app/(app)/_contexts/time-range/provider';
import { RangeSelector } from '@/app/(app)/_contexts/time-range/component';
import { useTimeRangeContext } from '@/app/(app)/_contexts/time-range/hook';

import type { ChartData } from '@/components/ui/charts/chart/types';
interface Props {
  originId: string;
}

export const OriginActivity: React.FC<Props> = ({ originId }) => {
  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.ThirtyDays}>
      <OriginActivityContent originId={originId} />
    </TimeRangeProvider>
  );
};

const OriginActivityContent: React.FC<Props> = ({ originId }) => {
  const { timeframe } = useTimeRangeContext();

  const [metadata] = api.public.origins.getMetadata.useSuspenseQuery(originId);

  const addresses = Array.from(
    new Set(
      metadata?.resources.flatMap(resource =>
        resource.accepts.map(accept => accept.payTo)
      )
    )
  );

  const { data: overallStats, isLoading: isOverallStatsLoading } =
    api.public.stats.overall.useQuery(
      {
        recipients: {
          include: addresses,
        },
        timeframe,
      },
      {
        enabled: !!metadata,
      }
    );
  const { data: bucketedStats, isLoading: isBucketedStatsLoading } =
    api.public.stats.bucketed.useQuery(
      {
        numBuckets: 48,
        timeframe,
        recipients: {
          include: addresses,
        },
      },
      {
        enabled: !!metadata,
      }
    );

  if (
    !bucketedStats ||
    !overallStats ||
    isBucketedStatsLoading ||
    isOverallStatsLoading
  ) {
    return <LoadingOriginActivity action={<RangeSelector />} />;
  }

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
    <OriginActivityContainer action={<RangeSelector />}>
      <OverallStatsCard
        title="Transactions"
        value={overallStats.total_transactions.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
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
        items={{
          type: 'bar',
          bars: [{ dataKey: 'totalAmount', color: 'var(--color-primary)' }],
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
    </OriginActivityContainer>
  );
};

export const LoadingOriginActivity = ({
  action,
}: {
  action?: React.ReactNode;
}) => {
  return (
    <OriginActivityContainer action={action}>
      <LoadingOverallStatsCard type="bar" title="Transactions" />
      <LoadingOverallStatsCard type="bar" title="Volume" />
      <LoadingOverallStatsCard type="bar" title="Buyers" />
    </OriginActivityContainer>
  );
};

const OriginActivityContainer = ({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) => {
  return (
    <OriginOverviewSection title="Activity" action={action}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
    </OriginOverviewSection>
  );
};
