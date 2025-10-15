'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Favicon } from '@/components/favicon';
import { Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  origin: RouterOutputs['origins']['list']['withResources']['byAddress'][number];
}

export const OriginCard: React.FC<Props> = ({ origin }) => {
  return (
    <Card>   
      <CardContent className="space-y-2 pt-2">
        <CardHeader className="flex-row items-center gap-2"> 
          <Favicon url={origin.favicon} className="size-4 mt-1.5" />
          <CardTitle>{origin.title ?? new URL(origin.origin).hostname}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>{origin.description ?? 'No description'}</CardDescription>
        </CardContent>
        <CardFooter className="flex items-end gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(origin.origin, '_blank')}
          >
            <Link2 className="size-3 mr-1" />
            Visit Origin
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

