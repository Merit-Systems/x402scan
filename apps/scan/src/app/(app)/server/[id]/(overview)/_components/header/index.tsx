import React, { Suspense } from 'react';

import { Server } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { Avatar } from '@/components/ui/avatar';

import { OriginStats, LoadingOriginStats } from './stats';

import { cn } from '@/lib/utils';

import { HeaderButtons, LoadingHeaderButtons } from './buttons';

import type { RouterOutputs } from '@/trpc/client';
import { X402V2Badge } from '@/app/(app)/_components/x402/v2-badge';

interface Props {
  origin: NonNullable<RouterOutputs['public']['origins']['get']>;
}

export const HeaderCard: React.FC<Props> = ({ origin }) => {
  return (
    <Card className={cn('relative mt-10 md:mt-12')}>
      <Card className="absolute top-0 left-4 -translate-y-1/2 size-12 md:size-16 flex items-center justify-center border rounded-md overflow-hidden">
        <Avatar
          src={origin.favicon}
          className="size-full border-none rounded-none"
          fallback={<Server className="size-8" />}
        />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="flex flex-col gap-4 p-4 pt-8 md:pt-10 col-span-5">
          <div className="">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold wrap-break-word line-clamp-2 min-w-0">
                {origin.title ?? new URL(origin.origin).hostname}
              </h1>
              {origin.hasX402V2Resource && (
                <X402V2Badge className="mt-1 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={origin.origin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold font-mono text-muted-foreground hover:underline break-all"
              >
                {origin.origin}
              </a>
            </div>
            <p
              className={cn(
                'wrap-break-word line-clamp-2 text-sm md:text-base',
                !origin.description
                  ? 'text-muted-foreground/60'
                  : 'text-muted-foreground'
              )}
            >
              {origin.description ?? 'No Description'}
            </p>
          </div>
          <Suspense fallback={<LoadingHeaderButtons />}>
            <HeaderButtons origin={origin} />
          </Suspense>
        </div>
        <div className="col-span-2">
          <Suspense fallback={<LoadingOriginStats />}>
            <OriginStats originId={origin.id} />
          </Suspense>
        </div>
      </div>
    </Card>
  );
};

export const LoadingHeaderCard = () => {
  return (
    <Card className={cn('relative mt-10 md:mt-12')}>
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
            <Skeleton className="w-48 h-[14px] my-[2px]" />
            <Skeleton className="w-64 h-[16px] my-[4px]" />
          </div>
          <LoadingHeaderButtons />
        </div>
        <div className="col-span-2 overflow-hidden">
          <LoadingOriginStats />
        </div>
      </div>
    </Card>
  );
};
