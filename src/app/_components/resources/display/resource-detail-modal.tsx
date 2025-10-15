'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { DrawerResourceExecutor } from '../executor/drawer-executor';
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-hidden sm:max-w-2xl w-full">
        <SheetHeader className="space-y-4 pb-4">
          <div className="flex items-start justify-between gap-4">
            <SheetTitle className="text-xl font-semibold break-words pr-8">
              Resource Details
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
          <DrawerResourceExecutor
            resource={resource}
            response={resource.data}
            bazaarMethod={bazaarMethod}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
