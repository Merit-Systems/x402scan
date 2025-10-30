import { Body } from '@/app/_components/layout/page-utils';

import { LoadingHeaderCard } from './_components/header';
import { LoadingOriginResources } from './_components/resources';
import { LoadingOriginActivity } from './_components/activity';
import { LoadingOriginAgents } from './_components/agents';

export default async function LoadingOriginPage() {
  return (
    <Body>
      <LoadingHeaderCard />
      <LoadingOriginActivity />
      <div className="grid grid-cols-1 md:grid-cols-7">
        <div className="col-span-5 px-4">
          <LoadingOriginResources />
        </div>
        <div className="col-span-2 py-4">
          <LoadingOriginAgents />
        </div>
      </div>
    </Body>
  );
}
