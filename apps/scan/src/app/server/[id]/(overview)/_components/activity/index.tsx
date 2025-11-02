'use client';

import { api } from '@/trpc/client';

import { LoadingOverallStatsCard, OverallStatsCard } from './card';

import { convertTokenAmount, formatTokenAmount } from '@/lib/token';

import type { ChartData } from '@/components/ui/charts/chart/types';
import { useState } from 'react';
import { OriginOverviewSection } from '../section';

interface Props {
  originId: string;
}

export const OriginActivity: React.FC<Props> = ({ originId }) => {
  const [endDate] = useState(new Date());

  const [metadata] = api.public.origins.getMetadata.useSuspenseQuery(originId);

  const addresses = Array.from(
    new Set(
      metadata?.resources.flatMap(resource =>
        resource.accepts.map(accept => accept.payTo)
      )
    )
  );

  const {
    data: firstTransferTimestamp,
    isLoading: isFirstTransferTimestampLoading,
  } = api.public.stats.firstTransferTimestamp.useQuery({
    recipients: {
      include: addresses,
    },
  });

  const { data: overallStats, isLoading: isOverallStatsLoading } =
    api.public.stats.overall.useQuery(
      {
        recipients: {
          include: addresses,
        },
        startDate: firstTransferTimestamp ?? endDate,
      },
      {
        enabled: !!metadata && !isFirstTransferTimestampLoading,
      }
    );
  const { data: bucketedStats, isLoading: isBucketedStatsLoading } =
    api.public.stats.bucketed.useQuery(
      {
        numBuckets: 48,
        startDate: firstTransferTimestamp ?? endDate,
        recipients: {
          include: addresses,
        },
      },
      {
        enabled: !!metadata && !isFirstTransferTimestampLoading,
      }
    );

  if (
    !bucketedStats ||
    !overallStats ||
    isBucketedStatsLoading ||
    isOverallStatsLoading
  ) {
    return <LoadingOriginActivity />;
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
    <OriginActivityContainer>
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

export const LoadingOriginActivity = () => {
  return (
    <OriginActivityContainer>
      <LoadingOverallStatsCard type="bar" title="Transactions" />
      <LoadingOverallStatsCard type="area" title="Volume" />
      <LoadingOverallStatsCard type="bar" title="Buyers" />
    </OriginActivityContainer>
  );
};

const OriginActivityContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <OriginOverviewSection title="Activity">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
    </OriginOverviewSection>
  );
};
