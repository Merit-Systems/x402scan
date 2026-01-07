import { Body } from '@/app/_components/layout/page-utils';

import { LoadingHeaderCard } from './_components/header';
import { LoadingOriginResources } from './_components/resources';
import { LoadingOriginActivity } from './_components/activity';
import { LoadingOriginAgents } from './_components/agents';

export default async function LoadingOriginPage() {
  return (
    <Body className="pt-0">
      <LoadingHeaderCard />
      <LoadingOriginActivity />
      <div className="md:grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 md:col-span-2 flex flex-col gap-8">
          <LoadingOriginResources />
        </div>
        <div className="col-span-1">
          <LoadingOriginAgents />
        </div>
      </div>
    </Body>
  );
}
