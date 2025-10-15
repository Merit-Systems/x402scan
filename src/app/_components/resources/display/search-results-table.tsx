'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Favicon } from '@/components/favicon';
import { Skeleton } from '@/components/ui/skeleton';
import type { RouterOutputs } from '@/trpc/client';

interface Props {
  origins:
    | RouterOutputs['origins']['search']
    | RouterOutputs['origins']['list']['aggregated']['items'];
  isLoading: boolean;
  searchTerm: string;
  onClose: () => void;
  showPopular?: boolean;
}

export const SearchResultsTable: React.FC<Props> = ({
  origins,
  isLoading,
  searchTerm,
  onClose,
  showPopular = false,
}) => {
  if (isLoading) {
    return (
      <div className="w-[80vw] h-screen overflow-y-auto px-4 pb-8 space-y-4 no-scrollbar">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-background/60 backdrop-blur-xl border border-white/10 shadow-2xl p-6"
          >
            <div className="flex items-start gap-6">
              <Skeleton className="size-16 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-7 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (origins.length === 0) {
    return (
      <div className="w-[80vw] h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <p className="text-muted-foreground text-lg">
            {showPopular
              ? 'No popular resources available'
              : `No resources found matching "${searchTerm}"`}
          </p>
          {!showPopular && (
            <p className="text-sm text-muted-foreground mt-2">
              Try a different search term or browse all resources below
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[80vw] h-screen overflow-y-auto px-4 pb-8 no-scrollbar">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          {showPopular
            ? `Most Popular This Month (${origins.length} resource${origins.length !== 1 ? 's' : ''})`
            : `Found ${origins.length} result${origins.length !== 1 ? 's' : ''}`}
        </h3>
      </div>
      <div className="space-y-4">
        {origins.map(item => {
          // Handle both aggregated and search result structures
          const origin = 'origins' in item ? item.origins[0] : item;
          if (!origin) return null;

          const hostname = new URL(origin.origin).hostname;
          const recipientAddress = origin.resources[0]?.accepts[0]?.payTo;

          return (
            <Link
              key={origin.id}
              href={
                recipientAddress
                  ? `/recipient/${recipientAddress}/resources`
                  : '#'
              }
              onClick={onClose}
              className="block group"
            >
              <div className="rounded-xl bg-background/90 backdrop-blur-xl border border-white/5 shadow-2xl hover:shadow-2xl hover:bg-background/110 transition-all duration-300 p-6 cursor-pointer">
                <div className="flex items-start gap-6">
                  <Favicon
                    url={origin.favicon}
                    className="size-16 rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                        {origin.title ?? hostname}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white/10 backdrop-blur-sm flex-shrink-0"
                      >
                        {origin.resources.length} resource
                        {origin.resources.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {origin.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {origin.description}
                      </p>
                    )}
                    <div className="text-xs font-mono text-muted-foreground/80">
                      {hostname}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
