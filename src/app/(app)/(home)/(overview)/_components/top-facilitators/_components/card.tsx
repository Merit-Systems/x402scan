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

interface Props {
  facilitator: Facilitator;
  stats: NonNullable<RouterOutputs['facilitators']['list']>[number];
  overallStats: NonNullable<RouterOutputs['stats']['getOverallStatistics']>;
}

export const FacilitatorCard: React.FC<Props> = async ({
  facilitator,
  stats,
  overallStats,
}) => {
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
                addresses={facilitator.addresses}
                className="text-xs leading-none"
              />
            </div>
          </div>
          <FacilitatorChart
            facilitator={facilitator}
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
