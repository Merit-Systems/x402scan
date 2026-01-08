import { Suspense } from 'react';

import { Body } from '@/app/_components/layout/page-utils';
import { Agents, LoadingAgents } from './_components/agents';
import { ComposerHomeHeading } from './_components/heading';
import { Tools } from './_components/tools';
import { OverallStats } from './_components/stats';
import { Feed } from './_components/feed';
import { auth } from '@/auth';
import { YourAgents } from './_components/your-agents';
import { api, HydrateClient } from '@/trpc/server';
import { ActivityTimeframe } from '@/types/timeframes';
import { defaultToolsSorting } from '@/app/_contexts/sorting/tools/default';

export default async function ComposerPage() {
  const session = await auth();

  // Prefetch all data for hydration
  const prefetches = [
    // Agents
    api.public.agents.list.prefetch({
      timeframe: ActivityTimeframe.OneDay,
      pagination: {
        page: 0,
        page_size: 10,
      },
    }),
    // Tools
    api.public.tools.top.prefetch({
      pagination: {
        page: 0,
        page_size: 10,
      },
      sorting: defaultToolsSorting,
    }),
    // Overall Stats
    api.public.agents.activity.overall.prefetch({
      timeframe: ActivityTimeframe.SevenDays,
    }),
    api.public.agents.activity.bucketed.prefetch({
      timeframe: ActivityTimeframe.SevenDays,
      numBuckets: 32,
    }),
    // Feed
    api.public.agents.activity.feed.prefetch({
      pagination: {
        page_size: 10,
        page: 0,
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
    <HydrateClient>
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
    </HydrateClient>
  );
}
