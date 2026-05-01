import { Body } from '@/app/_components/layout/page-utils';

import { LoadingHeaderCard } from './_components/header';
import { LoadingOriginResources } from './_components/resources';
import { LoadingOriginActivity } from './_components/activity';

export default function LoadingOriginPage() {
  return (
    <Body className="pt-0">
      <LoadingHeaderCard />
      <LoadingOriginActivity />
      <LoadingOriginResources />
    </Body>
  );
}
