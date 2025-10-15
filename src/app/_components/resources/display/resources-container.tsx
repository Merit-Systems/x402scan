'use client';

import React, { useState } from 'react';
import { ResourcesTable } from './resources-table';
import { ResourceDetailModal } from './resource-detail-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Favicon } from '@/components/favicon';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  originsWithResources: RouterOutputs['origins']['list']['withResources']['byAddress'];
}

type ResourceType = Props['originsWithResources'][0]['resources'][0];

export const ResourcesContainer: React.FC<Props> = ({ originsWithResources }) => {
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
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

  // If single origin, show just the table
  if (originsWithResources.length === 1) {
    const origin = originsWithResources[0];
    return (
      <>
        <ResourcesTable
          resources={origin.resources}
          onResourceSelect={handleResourceSelect}
        />
        
        <ResourceDetailModal
          resource={selectedResource}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      </>
    );
  }

  // If multiple origins, show tabs
  return (
    <>
      <Tabs defaultValue={originsWithResources[0]?.id} className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 h-auto">
          {originsWithResources.map((origin) => (
            <TabsTrigger
              key={origin.id}
              value={origin.id}
              className="flex items-center gap-2 p-3 data-[state=active]:bg-background"
            >
              <Favicon url={origin.favicon} className="size-4" />
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium line-clamp-1">
                  {new URL(origin.origin).hostname}
                </span>
                <span className="text-xs text-muted-foreground">
                  {origin.resources.length} resource{origin.resources.length !== 1 ? 's' : ''}
                </span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {originsWithResources.map((origin) => (
          <TabsContent key={origin.id} value={origin.id} className="mt-6">
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Favicon url={origin.favicon} className="size-8" />
                  <div>
                    <CardTitle className="text-lg">
                      {new URL(origin.origin).hostname}
                    </CardTitle>
                    <CardDescription>
                      {origin.title || origin.description || 'x402 Resource Origin'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            <ResourcesTable
              resources={origin.resources}
              onResourceSelect={handleResourceSelect}
            />
          </TabsContent>
        ))}
      </Tabs>
      
      <ResourceDetailModal
        resource={selectedResource}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};
