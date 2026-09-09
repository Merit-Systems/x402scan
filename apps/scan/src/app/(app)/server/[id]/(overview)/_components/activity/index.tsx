"use client";

import { Suspense } from "react";

import { ErrorBoundary } from "react-error-boundary";

import { OriginOverviewSection } from "../section";

import { LoadingOverallStatsCard, OverallStatsCard } from "./card";

import { api } from "@/trpc/client";

import { convertTokenAmount, formatTokenAmount } from "@/lib/token";

import { ActivityTimeframe } from "@/types/timeframes";
import { TimeRangeProvider } from "@/app/(app)/_contexts/time-range/provider";
import { RangeSelector } from "@/app/(app)/_contexts/time-range/component";
import { useTimeRangeContext } from "@/app/(app)/_contexts/time-range/hook";

import type { ChartData } from "@/components/ui/charts/chart/types";
interface Props {
  originId: string;
}

export const OriginActivity: React.FC<Props> = ({ originId }) => {
  return (
    <TimeRangeProvider initialTimeframe={ActivityTimeframe.ThirtyDays}>
      <OriginActivityContainer action={<RangeSelector />}>
        <ErrorBoundary
          fallback={
            <p className="text-sm text-muted-foreground md:col-span-3">
              There was an error loading the activity data
            </p>
          }
        >
          <Suspense fallback={<LoadingOriginActivityCards />}>
            <OriginActivityCharts originId={originId} />
          </Suspense>
        </ErrorBoundary>
      </OriginActivityContainer>
    </TimeRangeProvider>
  );
};

const OriginActivityCharts: React.FC<Props> = ({ originId }) => {
  const { timeframe } = useTimeRangeContext();

  const [overallStats] = api.public.stats.overallByOrigin.useSuspenseQuery({
    originId,
    timeframe,
  });
  const [bucketedStats] = api.public.stats.bucketedByOrigin.useSuspenseQuery({
    originId,
    numBuckets: 48,
    timeframe,
  });

  const chartData: ChartData<{
    transactions: number;
    totalAmount: number;
    buyers: number;
    sellers: number;
  }>[] = bucketedStats.map((stat) => ({
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
          notation: "compact",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={{
          type: "bar",
          bars: [{ dataKey: "transactions", color: "var(--color-primary)" }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: "transactions",
            label: "Transactions",
            getValue: (data) =>
              data.toLocaleString(undefined, {
                notation: "compact",
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
          type: "bar",
          bars: [{ dataKey: "totalAmount", color: "var(--color-primary)" }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: "totalAmount",
            label: "Volume",
            getValue: (data) =>
              data.toLocaleString(undefined, {
                notation: "compact",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                style: "currency",
                currency: "USD",
              }),
          },
        ]}
      />
      <OverallStatsCard
        title="Buyers"
        value={overallStats.unique_buyers.toLocaleString(undefined, {
          notation: "compact",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}
        items={{
          type: "bar",
          bars: [{ dataKey: "buyers", color: "var(--color-primary)" }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: "buyers",
            label: "Buyers",
            getValue: (data) =>
              data.toLocaleString(undefined, {
                notation: "compact",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }),
          },
        ]}
      />
    </>
  );
};

const LoadingOriginActivityCards = () => {
  return (
    <>
      <LoadingOverallStatsCard type="bar" title="Transactions" />
      <LoadingOverallStatsCard type="bar" title="Volume" />
      <LoadingOverallStatsCard type="bar" title="Buyers" />
    </>
  );
};

export const LoadingOriginActivity = ({
  action,
}: {
  action?: React.ReactNode;
}) => {
  return (
    <OriginActivityContainer action={action}>
      <LoadingOriginActivityCards />
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{children}</div>
    </OriginOverviewSection>
  );
};
