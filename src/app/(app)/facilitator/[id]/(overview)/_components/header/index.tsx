import React, { Suspense } from 'react';

import { Server } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Addresses } from '@/components/ui/address';
import { Avatar } from '@/components/ui/avatar';

import { OverallRecipientStats, LoadingOverallRecipientStats } from './stats';
import { HeaderButtons, LoadingHeaderButtons } from './buttons';

import { cn } from '@/lib/utils';

import type { Facilitator } from '@/lib/facilitators';

interface Props {
  facilitator: Facilitator;
}

export const HeaderCard: React.FC<Props> = async ({ facilitator }) => {
  return (
    <Card className={cn('relative mt-10 md:mt-12')}>
      <Card className="absolute top-0 left-4 -translate-y-1/2 size-12 md:size-16 flex items-center justify-center border rounded-md overflow-hidden">
        <Avatar
          src={facilitator.image}
          className="size-full border-none rounded-none"
          fallback={<Server className="size-8" />}
        />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="flex flex-col gap-4 p-4 pt-8 md:pt-10 col-span-5">
          <div className="">
            <h1 className="text-3xl font-bold break-words line-clamp-2">
              {facilitator.name} Facilitator
            </h1>
            <p className={cn('break-words line-clamp-2')}>
              <Addresses
                addresses={facilitator.addresses}
                className="border-none p-0 text-sm"
                side="bottom"
              />
            </p>
          </div>
          <HeaderButtons link={facilitator.link} />
        </div>
        <div className="col-span-2">
          <Suspense fallback={<LoadingOverallRecipientStats />}>
            <OverallRecipientStats addresses={facilitator.addresses} />
          </Suspense>
        </div>
      </div>
    </Card>
  );
};

export const LoadingHeaderCard = () => {
  return (
    <Card className={cn('relative mt-10 md:mt-12 mb-12')}>
      <Card className="absolute top-0 left-4 -translate-y-1/2 size-12 md:size-16 flex items-center justify-center border rounded-md overflow-hidden">
        <Avatar
          src={undefined}
          className="size-full"
          fallback={<Skeleton className="size-8" />}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="flex flex-col gap-4 p-4 pt-8 md:pt-10 col-span-5">
          <div className="">
            <Skeleton className="w-36 h-[30px] my-[3px]" />
            <Skeleton className="w-64 h-[16px] my-[4px]" />
          </div>
          <LoadingHeaderButtons />
        </div>
        <div className="col-span-2 overflow-hidden">
          <LoadingOverallRecipientStats />
        </div>
      </div>
    </Card>
  );
};
