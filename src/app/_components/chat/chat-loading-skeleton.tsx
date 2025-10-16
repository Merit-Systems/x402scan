'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export const ChatLoadingSkeleton = () => {
  return (
    <div className="flex h-full flex-col">
      {/* Top navigation skeleton */}
      <div className="flex-shrink-0 bg-background border-b">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="flex-1 h-10" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Messages area skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-3xl px-6 py-6 space-y-4">
          {/* Message skeletons */}
          <div className="flex justify-end">
            <Card className="max-w-[80%] p-4">
              <Skeleton className="h-4 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          </div>

          <div className="flex justify-start">
            <Card className="max-w-[80%] p-4">
              <Skeleton className="h-4 w-64 mb-2" />
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-4 w-56" />
            </Card>
          </div>

          <div className="flex justify-end">
            <Card className="max-w-[80%] p-4">
              <Skeleton className="h-4 w-36" />
            </Card>
          </div>

          <div className="flex justify-start">
            <Card className="max-w-[80%] p-4">
              <Skeleton className="h-4 w-72 mb-2" />
              <Skeleton className="h-4 w-48" />
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom prompt area skeleton */}
      <div className="flex-shrink-0 bg-background border-t">
        <div className="mx-auto max-w-3xl p-6">
          <div className="space-y-4">
            {/* Model selector and tools skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>

            {/* Input area skeleton */}
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-12" />
              <Skeleton className="h-12 w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
