import { Suspense } from 'react';

import { Body } from '@/app/_components/layout/page-utils';
import { Agents, LoadingAgents } from './_components/agents';
import { ComposerHomeHeading } from './_components/heading';
import { Tools } from './_components/tools';
import { OverallStats } from './_components/stats';
import { Feed } from './_components/feed';
import { auth } from '@/auth';
import { YourAgents } from './_components/your-agents';
import { api } from '@/trpc/server';
import { ActivityTimeframe } from '@/types/timeframes';

export default async function ComposerPage() {
  const session = await auth();

  // Prefetch agents data for hydration
  const prefetches = [
    api.public.agents.list.prefetch({
      timeframe: ActivityTimeframe.OneDay,
      pagination: {
        page: 0,
        page_size: 10,
      },
    }),
  ];

  // Conditionally prefetch user's agents if authenticated
  if (session?.user?.id) {
    prefetches.push(
      api.public.agents.list.prefetch({
        timeframe: ActivityTimeframe.ThirtyDays,
        pagination: {
          page: 0,
          page_size: 100,
        },
        userId: session.user.id,
      })
    );
  }

  await Promise.all(prefetches);

  return (
    <div>
      <ComposerHomeHeading />
      <Body>
        {session?.user?.id && (
          <Suspense fallback={<LoadingAgents />}>
            <YourAgents userId={session.user.id} />
          </Suspense>
        )}
        <Suspense fallback={<LoadingAgents />}>
          <Agents />
        </Suspense>
        <Tools />
        <Feed />
        <OverallStats />
      </Body>
    </div>
  );
}
