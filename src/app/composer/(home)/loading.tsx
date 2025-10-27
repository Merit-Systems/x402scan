import { Body } from '@/app/_components/layout/page-utils';
import { ComposerHomeHeading } from './_components/heading';
import { LoadingAgents } from './_components/agents';
import { LoadingTools } from './_components/tools';
import { LoadingOverallStats } from './_components/stats';
import { LoadingFeed } from './_components/feed';

export default function ComposerLoading() {
  return (
    <div>
      <ComposerHomeHeading />
      <Body>
        <LoadingAgents />
        <LoadingTools />
        <LoadingFeed />
        <LoadingOverallStats />
      </Body>
    </div>
  );
}
