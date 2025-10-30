import { Body } from '@/app/_components/layout/page-utils';

import { LoadingResourcesByOrigin } from '@/app/_components/resources/by-origin';

import { ResourcesHeading } from './_components/heading';

export default function AddressResourcesLoading() {
  return (
    <div>
      <ResourcesHeading />
      <Body className="gap-0">
        <LoadingResourcesByOrigin loadingRowCount={2} />
      </Body>
    </div>
  );
}
