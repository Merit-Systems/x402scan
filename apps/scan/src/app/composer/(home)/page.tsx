import { Suspense } from 'react';

import { Body } from '@/app/_components/layout/page-utils';
import { Agents, LoadingAgents } from './_components/agents';
import { ComposerHomeHeading } from './_components/heading';
import { Tools } from './_components/tools';
import { OverallStats } from './_components/stats';
import { Feed } from './_components/feed';
import { auth } from '@/auth';
import { YourAgents } from './_components/your-agents';

export default async function ComposerPage() {
  const session = await auth();

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
