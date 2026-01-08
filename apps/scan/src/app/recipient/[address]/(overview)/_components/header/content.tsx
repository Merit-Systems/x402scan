'use client';

import React, { Suspense } from 'react';

import { Globe, Server } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

import { OverallRecipientStats, LoadingOverallRecipientStats } from './stats';

import { cn, formatAddress } from '@/lib/utils';

import { api } from '@/trpc/client';
import { Address } from '@/components/ui/address';
import { HeaderButtons } from './buttons';

type Props = {
  address: string;
};

export const HeaderCardContent: React.FC<Props> = ({ address }) => {
  const [origins] = api.public.origins.list.origins.useSuspenseQuery({
    address,
  });

  return (
    <Card className={cn('relative mt-10 md:mt-12')}>
      <Card className="absolute top-0 left-4 -translate-y-1/2 size-12 md:size-16 flex items-center justify-center border rounded-md overflow-hidden">
        <Avatar
          src={origins.length === 1 ? origins[0]!.favicon : null}
          className="size-8 border-none rounded-none"
          fallback={
            origins.length === 1 ? (
              <Globe className="size-8" />
            ) : (
              <Server className="size-8" />
            )
          }
        />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="flex flex-col gap-4 p-4 pt-8 md:pt-10 col-span-5">
          <div className="">
            <h1 className="text-3xl font-bold wrap-break-words line-clamp-2">
              {origins.length === 0
                ? formatAddress(address)
                : origins.length === 1
                  ? new URL(origins[0]!.origin).hostname
                  : `${origins.length} servers`}
            </h1>
            <p
              className={cn(
                'wrap-break-words line-clamp-2',
                origins.length === 0
                  ? 'text-muted-foreground/60'
                  : 'text-muted-foreground'
              )}
            >
              {origins.length === 0 ? (
                'This address is not associated with any known servers'
              ) : (
                <Address
                  address={address}
                  className="border-none p-0 text-sm"
                  side="bottom"
                />
              )}
            </p>
          </div>
          <HeaderButtons hasOrigins={origins.length > 0} address={address} />
        </div>
        <div className="col-span-2">
          <Suspense fallback={<LoadingOverallRecipientStats />}>
            <OverallRecipientStats address={address} />
          </Suspense>
        </div>
      </div>
    </Card>
  );
};
