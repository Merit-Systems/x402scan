'use client';

import { api } from '@/trpc/client';

import { LoadingOverallStatsCard, OverallStatsCard } from './card';

import type { ChartData } from '@/components/ui/charts/chart/types';
import { useTimeRangeContext } from '@/app/_contexts/time-range/hook';

export const ServersCharts = () => {
  const { startDate, endDate } = useTimeRangeContext();

  const { data: allOverallStats, isLoading: isAllOverallStatsLoading } =
    api.public.sellers.all.stats.overall.useQuery({
      startDate,
      endDate,
    });

  const { data: allBucketedStats, isLoading: isAllBucketedStatsLoading } =
    api.public.sellers.all.stats.bucketed.useQuery({
      startDate,
      endDate,
    });

  const { data: bazaarOverallStats, isLoading: isBazaarOverallStatsLoading } =
    api.public.sellers.bazaar.stats.overall.useQuery({
      startDate,
      endDate,
    });

  const { data: bazaarBucketedStats, isLoading: isBazaarBucketedStatsLoading } =
    api.public.sellers.bazaar.stats.bucketed.useQuery({
      startDate,
      endDate,
    });

  if (
    !allOverallStats ||
    isAllOverallStatsLoading ||
    !allBucketedStats ||
    isAllBucketedStatsLoading ||
    !bazaarOverallStats ||
    isBazaarOverallStatsLoading ||
    !bazaarBucketedStats ||
    isBazaarBucketedStatsLoading
  ) {
    return <LoadingServersCharts />;
  }

  return (
    <OriginActivityContainer>
      <OverallStatsCard
        title="Active Merchants"
        value={allOverallStats.total_sellers.toLocaleString(undefined, {
          notation: 'compact',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={{
          type: 'bar',
          bars: [{ dataKey: 'sellers', color: 'var(--color-primary)' }],
        }}
        data={
          (allBucketedStats?.map(stat => ({
            timestamp: stat.bucket_start.toISOString(),
            sellers: stat.total_sellers,
          })) ?? []) as ChartData<{
            sellers: number;
          }>[]
        }
        tooltipRows={[
          {
            key: 'sellers',
            label: 'Sellers',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
          },
        ]}
      />
      {/* All new sellers */}
      <OverallStatsCard
        title="New Merchants"
        value={
          allOverallStats?.new_sellers?.toLocaleString(undefined, {
            notation: 'compact',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) ?? '–'
        }
        items={{
          type: 'bar',
          bars: [{ dataKey: 'newSellers', color: 'var(--color-primary)' }],
        }}
        data={
          (allBucketedStats?.map(stat => ({
            timestamp: stat.bucket_start.toISOString(),
            newSellers: stat.new_sellers,
          })) ?? []) as ChartData<{ newSellers: number }>[]
        }
        tooltipRows={[
          {
            key: 'newSellers',
            label: 'All New Sellers',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
          },
        ]}
      />

      {/* Bazaar sellers */}
      <OverallStatsCard
        title="Active Registered Merchants"
        value={
          bazaarOverallStats?.total_sellers?.toLocaleString(undefined, {
            notation: 'compact',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) ?? '–'
        }
        items={{
          type: 'bar',
          bars: [{ dataKey: 'bazaarSellers', color: 'var(--color-primary)' }],
        }}
        data={
          (bazaarBucketedStats?.map(stat => ({
            timestamp: stat.bucket_start.toISOString(),
            bazaarSellers: stat.total_sellers,
          })) ?? []) as ChartData<{ bazaarSellers: number }>[]
        }
        tooltipRows={[
          {
            key: 'bazaarSellers',
            label: 'Bazaar Sellers',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
          },
        ]}
      />

      {/* Bazaar new sellers */}
      <OverallStatsCard
        title="New Registered Merchants"
        value={
          bazaarOverallStats?.new_sellers?.toLocaleString(undefined, {
            notation: 'compact',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }) ?? '–'
        }
        items={{
          type: 'bar',
          bars: [
            { dataKey: 'bazaarNewSellers', color: 'var(--color-primary)' },
          ],
        }}
        data={
          (bazaarBucketedStats?.map(stat => ({
            timestamp: stat.bucket_start.toISOString(),
            bazaarNewSellers: stat.new_sellers,
          })) ?? []) as ChartData<{ bazaarNewSellers: number }>[]
        }
        tooltipRows={[
          {
            key: 'bazaarNewSellers',
            label: 'Bazaar New Sellers',
            getValue: data =>
              data.toLocaleString(undefined, {
                notation: 'compact',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }),
          },
        ]}
      />
    </OriginActivityContainer>
  );
};

export const LoadingServersCharts = () => {
  return (
    <OriginActivityContainer>
      <LoadingOverallStatsCard type="bar" title="Active Merchants" />
      <LoadingOverallStatsCard type="bar" title="New Merchants" />
      <LoadingOverallStatsCard type="bar" title="Active Registered Merchants" />
      <LoadingOverallStatsCard type="bar" title="New Registered Merchants" />
    </OriginActivityContainer>
  );
};

const OriginActivityContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{children}</div>
  );
};
