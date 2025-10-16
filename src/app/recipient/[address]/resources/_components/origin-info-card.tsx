'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Favicon } from '@/components/favicon';
import { Server } from 'lucide-react';
import { Address } from '@/components/ui/address';
import { cn } from '@/lib/utils';
import { OriginCard } from '@/app/recipient/[address]/resources/_components/origin-card';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  origins: RouterOutputs['origins']['list']['withResources']['byAddress'];
  address: string;
  selectedOriginId?: string;
  onOriginSelect?: (originId: string) => void;
}

export const OriginInfoCard: React.FC<Props> = ({
  origins,
  address,
  selectedOriginId,
  onOriginSelect,
}) => {
  const totalResources = origins.reduce(
    (acc, origin) => acc + origin.resources.length,
    0
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-lg bg-muted flex items-center justify-center">
            {origins.length === 1 ? (
              <Favicon url={origins[0].favicon} className="size-8" />
            ) : (
              <Server className="size-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">
              {origins.length === 0
                ? 'No Origins Found'
                : origins.length === 1
                  ? new URL(origins[0].origin).hostname
                  : `${origins.length} Origins`}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalResources} resource{totalResources !== 1 ? 's' : ''}{' '}
              available
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Address address={address} />
          </div>
        </div>
      </CardHeader>

      {origins.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Single origin display */}
            {origins.length === 1 && <OriginCard origin={origins[0]} />}

            {/* Multiple origins summary */}
            {origins.length > 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {origins.map(origin => {
                    const isSelected = selectedOriginId === origin.id;
                    return (
                      <button
                        key={origin.id}
                        onClick={() => onOriginSelect?.(origin.id)}
                        className={cn(
                          'flex items-center gap-2 p-2 rounded-md transition-colors text-left',
                          isSelected
                            ? 'bg-foreground text-background shadow-sm'
                            : 'bg-muted/50 hover:bg-muted'
                        )}
                      >
                        <Favicon url={origin.favicon} className="size-4" />
                        <span className="text-xs truncate">
                          {new URL(origin.origin).hostname}
                        </span>
                        <Badge
                          variant={isSelected ? 'secondary' : 'outline'}
                          className="text-xs ml-auto"
                        >
                          {origin.resources.length}
                        </Badge>
                      </button>
                    );
                  })}
                </div>

                {selectedOriginId &&
                  (() => {
                    const selectedOrigin = origins.find(
                      o => o.id === selectedOriginId
                    );
                    if (!selectedOrigin) return null;

                    return <OriginCard origin={selectedOrigin} />;
                  })()}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
