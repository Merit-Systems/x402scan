'use client';

import Link from 'next/link';

import { Clock, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

import { Favicon } from '@/app/(app)/_components/favicon';

import { decodeHtmlEntities } from '@/lib/utils';

import type { RouterOutputs } from '@/trpc/client';

type RecentOrigin =
  RouterOutputs['public']['origins']['recent'][number];

interface Props {
  origin: RecentOrigin;
}

export const JustAddedCard: React.FC<Props> = ({ origin }) => {
  const resourceCount = origin.resources.length;
  const tags = Array.from(
    new Set(
      origin.resources.flatMap(r => r.tags.map(t => t.tag.name))
    )
  ).slice(0, 3);

  const listedAgo = formatDistanceToNow(new Date(origin.createdAt), {
    addSuffix: true,
  });

  return (
    <Link href={`/server/${origin.id}`}>
      <Card className="h-full flex flex-col overflow-hidden hover:border-primary transition-all duration-200 cursor-pointer group hover:-translate-y-2 hover:shadow-lg">
        {/* Image area */}
        <div className="relative aspect-[4/3] bg-muted/50 flex items-center justify-center overflow-hidden">
          {origin.ogImages?.[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={origin.ogImages[0].url}
              alt={origin.title ?? origin.origin}
              className="w-full h-full object-cover"
            />
          ) : origin.favicon ? (
            <Favicon url={origin.favicon} className="size-16" />
          ) : (
            <Globe className="size-16 text-muted-foreground/30" />
          )}
          {/* Resource count badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="text-[10px] font-mono bg-background/80 backdrop-blur-sm">
              {resourceCount} {resourceCount === 1 ? 'endpoint' : 'endpoints'}
            </Badge>
          </div>
        </div>

        {/* Content area */}
        <div className="flex flex-col gap-1.5 p-3">
          <div className="flex items-center gap-2">
            <Favicon url={origin.favicon} className="size-4 shrink-0" />
            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {origin.title
                ? decodeHtmlEntities(origin.title)
                : new URL(origin.origin).hostname}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {origin.description
              ? decodeHtmlEntities(origin.description)
              : origin.origin}
          </p>
          <div className="flex items-center justify-between mt-0.5">
            {tags.length > 0 ? (
              <div className="flex gap-1 flex-wrap">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <div />
            )}
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
              <Clock className="size-2.5" />
              Listed {listedAgo}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export const LoadingJustAddedCard = () => {
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center">
        <Skeleton className="size-12 rounded-full" />
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-full shrink-0" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </Card>
  );
};
