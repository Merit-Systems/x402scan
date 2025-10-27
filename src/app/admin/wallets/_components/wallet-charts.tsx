'use client';

import { api } from '@/trpc/client';
import { useMemo } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BaseAreaChart,
  LoadingAreaChart,
} from '@/components/ui/charts/chart/area';
import {
  BaseBarChart,
  LoadingBarChart,
} from '@/components/ui/charts/chart/bar';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { Skeleton } from '@/components/ui/skeleton';

interface WalletChartsProps {
  days?: number;
}

export const WalletCharts = ({ days = 7 }: WalletChartsProps) => {
  const { data: aggregates, isLoading } = api.admin.wallets.aggregates.useQuery({
    days,
  });

  const chartData = useMemo((): ChartData<{
    balance: number;
    wallets: number;
  }>[] => {
    if (!aggregates) return [];

    return aggregates.map((agg) => ({
      balance: Number(agg.balance) / 1_000_000, // Convert from raw USDC to decimal
      wallets: agg.numWallets,
      timestamp: new Date(agg.timestamp).toISOString(),
    }));
  }, [aggregates]);

  const currentBalance = useMemo(() => {
    if (!aggregates || aggregates.length === 0) return '0';
    // Most recent snapshot is first (ORDER BY timestamp DESC)
    const latest = aggregates[0];
    const balance = Number(latest.balance) / 1_000_000;
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      style: 'currency',
      currency: 'USD',
    });
  }, [aggregates]);

  const currentWalletCount = useMemo(() => {
    if (!aggregates || aggregates.length === 0) return '0';
    const latest = aggregates[0];
    return latest.numWallets.toLocaleString(undefined, {
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }, [aggregates]);

  if (isLoading) {
    return (
      <>
        <LoadingWalletCard title="Total USDC Balance" type="area" />
        <LoadingWalletCard title="Number of Wallets" type="bar" />
      </>
    );
  }

  return (
    <>
      <WalletCard
        title="Total USDC Balance"
        value={currentBalance}
        items={{
          type: 'area',
          areas: [{ dataKey: 'balance', color: 'var(--color-primary)' }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: 'balance',
            label: 'Balance',
            getValue: (data) =>
              data.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                style: 'currency',
                currency: 'USD',
              }),
          },
        ]}
      />
      <WalletCard
        title="Number of Wallets"
        value={currentWalletCount}
        items={{
          type: 'bar',
          bars: [{ dataKey: 'wallets', color: 'var(--color-primary)' }],
        }}
        data={chartData}
        tooltipRows={[
          {
            key: 'wallets',
            label: 'Wallets',
            getValue: (data) =>
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

type ChartItems<T extends Record<string, number>> =
  | {
      type: 'bar';
      bars: Array<{
        dataKey: keyof T;
        color: string;
      }>;
    }
  | {
      type: 'area';
      areas: Array<{
        dataKey: keyof T;
        color: string;
      }>;
    };

type WalletCardProps<T extends Record<string, number>> = {
  title: string;
  value: string;
  items: ChartItems<T>;
  data: ChartData<T>[];
  tooltipRows?: Array<{
    key: keyof T;
    label: string;
    getValue: (data: number) => string;
  }>;
};

const WalletCard = <T extends Record<string, number>>({
  title,
  value,
  items,
  data,
  tooltipRows,
}: WalletCardProps<T>) => {
  return (
    <Card>
      <CardHeader className="space-y-0">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-bold">{value}</CardTitle>
      </CardHeader>
      {items.type === 'bar' ? (
        <BaseBarChart
          data={data}
          bars={items.bars}
          height={100}
          tooltipRows={tooltipRows}
        />
      ) : (
        <BaseAreaChart
          data={data}
          areas={items.areas}
          height={100}
          tooltipRows={tooltipRows}
        />
      )}
    </Card>
  );
};

const LoadingWalletCard = ({
  type,
  title,
}: {
  type: 'bar' | 'area';
  title: string;
}) => {
  return (
    <Card>
      <CardHeader className="space-y-0">
        <CardDescription>{title}</CardDescription>
        <Skeleton className="h-6 my-1 w-20" />
      </CardHeader>
      {type === 'bar' ? (
        <LoadingBarChart height={100} />
      ) : (
        <LoadingAreaChart height={100} />
      )}
    </Card>
  );
};

