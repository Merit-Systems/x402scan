'use client';

import React, { Suspense } from 'react';

import { User } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';

import { OverallBuyerStats, LoadingOverallBuyerStats } from './stats';

import { cn, formatAddress } from '@/lib/utils';

import { Address } from '@/components/ui/address';
import { HeaderButtons } from './buttons';

interface Props {
  address: string;
}

export const HeaderCardContent: React.FC<Props> = ({ address }) => {
  return (
    <Card className={cn('relative mt-10 md:mt-12')}>
      <Card className="absolute top-0 left-4 -translate-y-1/2 size-12 md:size-16 flex items-center justify-center border rounded-md overflow-hidden">
        <Avatar
          src={null}
          className="size-8 border-none rounded-none"
          fallback={<User className="size-8" />}
        />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="flex flex-col gap-4 p-4 pt-8 md:pt-10 col-span-5">
          <div className="">
            <h1 className="text-3xl font-bold wrap-break-words line-clamp-2">
              {formatAddress(address)}
            </h1>
            <p className="text-muted-foreground">
              <Address
                address={address}
                className="border-none p-0 text-sm"
                side="bottom"
              />
            </p>
          </div>
          <HeaderButtons address={address} />
        </div>
        <div className="col-span-2">
          <Suspense fallback={<LoadingOverallBuyerStats />}>
            <OverallBuyerStats address={address} />
          </Suspense>
        </div>
      </div>
    </Card>
  );
};
