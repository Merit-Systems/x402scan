'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Favicon } from '@/components/favicon';
import { Globe, Server, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  origins: RouterOutputs['origins']['list']['withResources']['byAddress'];
  address: string;
}

export const OriginInfoCard: React.FC<Props> = ({ origins, address }) => {
  const totalResources = origins.reduce((acc, origin) => acc + origin.resources.length, 0);
  
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
              {totalResources} resource{totalResources !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {address.slice(0, 6)}...{address.slice(-4)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {origins.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Primary origin details if single origin */}
            {origins.length === 1 && (
              <div className="space-y-2">
                {origins[0].title && (
                  <div>
                    <h3 className="font-medium">{origins[0].title}</h3>
                  </div>
                )}
                {origins[0].description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {origins[0].description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(origins[0].origin, '_blank')}
                  >
                    <Link2 className="size-3 mr-1" />
                    Visit Origin
                  </Button>
                </div>
              </div>
            )}
            
            {/* Multiple origins summary */}
            {origins.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {origins.slice(0, 6).map((origin) => (
                  <div
                    key={origin.id}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                  >
                    <Favicon url={origin.favicon} className="size-4" />
                    <span className="text-xs truncate">
                      {new URL(origin.origin).hostname}
                    </span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {origin.resources.length}
                    </Badge>
                  </div>
                ))}
                {origins.length > 6 && (
                  <div className="flex items-center justify-center p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                    +{origins.length - 6} more
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
