import { Body } from '@/app/_components/layout/page-utils';
import { Agents, LoadingAgents } from './_components/agents';
import { ComposerHomeHeading } from './_components/heading';
import { Tools } from './_components/tools';
import { OverallStats } from './_components/stats';
import { Feed } from './_components/feed';
import { YourAgents } from './_components/your-agents';
import { Suspense } from 'react';

export default async function ComposerPage() {
  return (
    <div>
      <ComposerHomeHeading />
      <Body>
        <Suspense fallback={null}>
          <YourAgents />
        </Suspense>
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
