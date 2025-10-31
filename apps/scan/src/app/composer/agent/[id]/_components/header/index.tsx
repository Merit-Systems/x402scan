import React from 'react';

import { BotMessageSquare } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { Avatar } from '@/components/ui/avatar';

import { AgentStats, LoadingAgentStats } from './stats';

import { cn } from '@/lib/utils';

import { HeaderButtons, LoadingHeaderButtons } from './button';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  agentConfiguration: NonNullable<RouterOutputs['public']['agents']['get']>;
}

export const HeaderCard: React.FC<Props> = async ({ agentConfiguration }) => {
  return (
    <Card className={cn('relative mt-10 md:mt-12')}>
      <Card className="absolute top-0 left-4 -translate-y-1/2 size-12 md:size-16 flex items-center justify-center border rounded-md overflow-hidden">
        <Avatar
          src={agentConfiguration.image}
          className="size-full border-none rounded-md"
          fallback={<BotMessageSquare className="size-8" />}
        />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="flex flex-col gap-4 p-4 pt-8 md:pt-10 col-span-5">
          <div className="">
            <h1
              className={cn(
                'text-3xl font-bold break-words line-clamp-2',
                agentConfiguration.name
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {agentConfiguration.name || 'Untitled Agent'}
            </h1>
            <p
              className={cn(
                'break-words line-clamp-2',
                agentConfiguration.description &&
                  agentConfiguration.description.length > 0
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {agentConfiguration.description &&
              agentConfiguration.description.length > 0
                ? agentConfiguration.description
                : 'No description'}
            </p>
          </div>
          <HeaderButtons agentConfiguration={agentConfiguration} />
        </div>
        <div className="col-span-2">
          <AgentStats agentConfiguration={agentConfiguration} />
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
          fallback={<Skeleton className="size-full" />}
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
        <div className="col-span-2">
          <LoadingAgentStats />
        </div>
      </div>
    </Card>
  );
};
