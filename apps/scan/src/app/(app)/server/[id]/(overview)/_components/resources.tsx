'use client';

import { useState } from 'react';

import {
  OriginResources as OriginResourcesComponent,
  LoadingOriginResources as LoadingOriginResourcesComponent,
} from '@/app/(app)/_components/resources/origin-resources';

import { Button } from '@/components/ui/button';
import { api } from '@/trpc/client';
import { OriginOverviewSection } from './section';
import { RefreshButton } from './refresh-button';

const INITIAL_LIMIT = 10;

interface Props {
  originId: string;
}

export const OriginResources: React.FC<Props> = ({ originId }) => {
  const [[origin]] = api.public.origins.list.withResources.useSuspenseQuery({
    originIds: [originId],
  });

  const [showAll, setShowAll] = useState(false);
  const allResources = origin?.resources ?? [];
  const hasMore = allResources.length > INITIAL_LIMIT;
  const visibleResources = showAll
    ? allResources
    : allResources.slice(0, INITIAL_LIMIT);

  return (
    <OriginOverviewSection
      title="Resources"
      className="gap-0"
      action={origin ? <RefreshButton origin={origin.origin} /> : undefined}
    >
      <OriginResourcesComponent
        resources={visibleResources}
        defaultOpen={false}
        hideOrigin
        isFlat
      />
      {hasMore && !showAll && (
        <Button
          variant="ghost"
          className="mt-2 w-full text-muted-foreground"
          onClick={() => setShowAll(true)}
        >
          Show {allResources.length - INITIAL_LIMIT} more
        </Button>
      )}
    </OriginOverviewSection>
  );
};

export const LoadingOriginResources = () => {
  return (
    <OriginOverviewSection title="Resources" className="gap-0">
      <LoadingOriginResourcesComponent />
    </OriginOverviewSection>
  );
};
