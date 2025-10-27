import React from 'react';

import Link from 'next/link';

import { Server } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Addresses } from '@/components/ui/address';
import { Avatar } from '@/components/ui/avatar';

import { FacilitatorChart, LoadingFacilitatorChart } from './chart';
import { FacilitatorStats, LoadingFacilitatorStats } from './stats';

import type { Facilitator } from '@/lib/facilitators';
import type { RouterOutputs } from '@/trpc/client';
import type { ChartData } from '@/components/ui/charts/chart/types';
import { useChain } from '@/app/_contexts/chain/hook';

interface Props {
  facilitator: Facilitator;
  stats: RouterOutputs['public']['facilitators']['list']['items'][number];
  overallStats: NonNullable<RouterOutputs['public']['stats']['overall']>;
  chartData: ChartData<{
    total_transactions: number;
  }>[];
}

export const FacilitatorCard: React.FC<Props> = ({
  facilitator,
  stats,
  overallStats,
  chartData,
}) => {
  const { chain } = useChain();

  return (
    <Link href={`/facilitator/${facilitator.id}`} prefetch={false}>
      <Card className="grid grid-cols-1 md:grid-cols-7 hover:border-primary hover:bg-card/80 transition-colors">
        <div className="flex flex-col col-span-5">
          <div className="flex items-center gap-2 p-4">
            <Avatar
              src={facilitator.image}
              className="size-8 border-none"
              fallback={<Server className="size-8" />}
            />
            <div className="flex flex-col h-fit gap-1">
              <h1 className="text-lg font-bold break-words leading-none">
                {facilitator.name}
              </h1>
              <Addresses
                addresses={
                  chain
                    ? (facilitator.addresses[chain] ?? [])
                    : Object.values(facilitator.addresses).flat()
                }
                className="text-xs leading-none"
              />
            </div>
          </div>
          <FacilitatorChart
            chartData={chartData}
            total_transactions={Number(overallStats.total_transactions)}
          />
        </div>
        <div className="col-span-2">
          <FacilitatorStats stats={stats} />
        </div>
      </Card>
    </Link>
  );
};

export const LoadingFacilitatorCard = () => {
  return (
    <Card className="grid grid-cols-1 md:grid-cols-7">
      <div className="flex flex-col col-span-5">
        <div className="flex items-center gap-2 p-4">
          <Skeleton className="size-8" />
          <div className="flex flex-col h-fit gap-1">
            <Skeleton className="w-24 h-[18px]" />
            <Skeleton className="w-32 h-3" />
          </div>
        </div>
        <LoadingFacilitatorChart />
      </div>
      <div className="col-span-2">
        <LoadingFacilitatorStats />
      </div>
    </Card>
  );
};
