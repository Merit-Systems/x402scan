import { Body } from '@/app/_components/layout/page-utils';

import { LoadingHeaderCard } from './_components/header';
import { LoadingTools } from './_components/tools';
import { LoadingActivity } from './_components/activity';

export default async function LoadingAgentPage() {
  return (
    <Body className="gap-8 pt-0">
      <LoadingHeaderCard />
      <LoadingTools />
      <LoadingActivity />
    </Body>
  );
}
