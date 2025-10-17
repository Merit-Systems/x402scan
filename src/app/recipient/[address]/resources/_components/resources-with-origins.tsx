'use client';

import React, { useState } from 'react';
import { OriginInfoCard } from './origin-info-card';
import { ResourcesContainer } from './resources-container';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  originsWithResources: RouterOutputs['origins']['list']['withResources']['byAddress'];
  address: string;
}

export const ResourcesWithOrigins: React.FC<Props> = ({
  originsWithResources,
  address,
}) => {
  const [selectedOriginId, setSelectedOriginId] = useState<string>(
    originsWithResources[0]?.id || ''
  );

  return (
    <>
      <OriginInfoCard
        origins={originsWithResources}
        address={address}
        selectedOriginId={selectedOriginId}
        onOriginSelect={setSelectedOriginId}
      />
      <ResourcesContainer
        originsWithResources={originsWithResources}
        selectedOriginId={selectedOriginId}
      />
    </>
  );
};
