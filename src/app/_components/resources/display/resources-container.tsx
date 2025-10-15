'use client';

import React, { useState } from 'react';
import { ResourcesTable } from './resources-table';
import { ResourceDetailModal } from './resource-detail-modal';
import { Card, CardContent } from '@/components/ui/card';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  originsWithResources: RouterOutputs['origins']['list']['withResources']['byAddress'];
  selectedOriginId?: string;
}

type ResourceType = Props['originsWithResources'][0]['resources'][0];

export const ResourcesContainer: React.FC<Props> = ({
  originsWithResources,
  selectedOriginId,
}) => {
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  const handleResourceSelect = (resource: ResourceType) => {
    setSelectedResource(resource);
    setModalOpen(true);
  };

  if (originsWithResources.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No resources found for this address.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find the origin to display (either selected or first one)
  const displayOrigin = selectedOriginId
    ? (originsWithResources.find(o => o.id === selectedOriginId) ??
      originsWithResources[0])
    : originsWithResources[0];

  return (
    <>
      <ResourcesTable
        resources={displayOrigin.resources}
        onResourceSelect={handleResourceSelect}
      />

      <ResourceDetailModal
        resource={selectedResource}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};
