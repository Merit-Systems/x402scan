import { Suspense } from 'react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';

import { LoadingOverallRecipientStats } from './stats';

import { cn } from '@/lib/utils';

import { HydrateClient } from '@/trpc/server';
import { LoadingHeaderButtons } from './buttons';
import { HeaderCardContent } from './content';

type Props = {
  address: string;
};

export const HeaderCard: React.FC<Props> = ({ address }) => {
  return (
    <HydrateClient>
      <Suspense fallback={<LoadingHeaderCard />}>
        <HeaderCardContent address={address} />
      </Suspense>
    </HydrateClient>
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
