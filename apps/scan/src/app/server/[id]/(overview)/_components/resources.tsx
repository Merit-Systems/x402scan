'use client';

import {
  OriginResources as OriginResourcesComponent,
  LoadingOriginResources as LoadingOriginResourcesComponent,
} from '@/app/_components/resources/origin-resources';

import { api } from '@/trpc/client';
import { OriginOverviewSection } from './section';

interface Props {
  originId: string;
}

export const OriginResources: React.FC<Props> = ({ originId }) => {
  const [[origin]] = api.public.origins.list.withResources.useSuspenseQuery({
    originIds: [originId],
  });

  return (
    <OriginOverviewSection title="Resources" className="gap-0">
      <OriginResourcesComponent
        resources={origin?.resources ?? []}
        defaultOpen
        hideOrigin
        isFlat
      />
    </OriginOverviewSection>
  );
};

export const LoadingOriginResources = () => {
  return (
    <OriginOverviewSection title="Resources">
      <LoadingOriginResourcesComponent />
    </OriginOverviewSection>
  );
};
