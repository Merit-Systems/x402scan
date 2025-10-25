'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/trpc/client';
import { ResourceExecutor } from '@/app/_components/resources/executor';
import { parseX402Response } from '@/lib/x402/schema';
import { Loader2 } from 'lucide-react';
import { getBazaarMethod } from '@/app/_components/resources/executor/utils';

interface ResourceExecutorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
}

export function ResourceExecutorModal({
  open,
  onOpenChange,
  resourceId,
}: ResourceExecutorModalProps) {
  const { data: resource, isLoading } = api.public.resources.getById.useQuery(
    resourceId,
    { enabled: open }
  );

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading Resource</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!resource || !resource.response?.response) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Resource Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {!resource
              ? 'Resource could not be loaded.'
              : 'Resource has no response data.'}
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  const parsedResponse = parseX402Response(resource.response.response);

  if (!parsedResponse.success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Parse Error</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Failed to parse X402 response: {parsedResponse.errors.join(', ')}
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono break-all">
            {resource.resource}
          </DialogTitle>
        </DialogHeader>
        <ResourceExecutor
          resource={resource}
          bazaarMethod={getBazaarMethod(resource.accepts[0].outputSchema)}
          response={parsedResponse.data}
          className="bg-transparent"
        />
      </DialogContent>
    </Dialog>
  );
}
