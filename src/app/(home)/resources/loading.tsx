import { Body } from '../../_components/layout/page-utils';
import { LoadingResourcesByOrigin } from '@/app/_components/resources/by-origin';
import { ResourcesHeading } from './_components/heading';

export default function ResourcesLoading() {
  return (
    <div>
      <ResourcesHeading />
      <Body>
        <LoadingResourcesByOrigin loadingRowCount={6} />
      </Body>
    </div>
  );
}
