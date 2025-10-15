'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ResourceExecutor } from '../executor';
import { getBazaarMethod } from '../executor/utils';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  resource: RouterOutputs['origins']['list']['withResources']['byAddress'][0]['resources'][0] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ResourceDetailModal: React.FC<Props> = ({
  resource,
  open,
  onOpenChange,
}) => {
  if (!resource) return null;

  const bazaarMethod = getBazaarMethod(resource.accepts[0].outputSchema);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="line-clamp-1">
            {resource.resource}
          </DialogTitle>
          <DialogDescription className="line-clamp-2">
            {resource.accepts[0]?.description || 'x402 Resource'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <ResourceExecutor
            resource={resource}
            response={resource.data}
            bazaarMethod={bazaarMethod}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
