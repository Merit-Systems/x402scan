import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { safeGetHostname } from '@/lib/url';
import { Addresses } from '@/components/ui/address';

import type { RouterOutputs } from '@/trpc/client';
import { Favicon } from '@/components/favicon';

type BazaarItem = RouterOutputs['sellers']['list']['bazaar']['items'][number];
type AggregatedItem =
  RouterOutputs['origins']['list']['aggregated']['items'][number];

interface Props {
  origin: BazaarItem | AggregatedItem;
  className?: string;
  featured?: boolean;
  compact?: boolean;
}

export const OriginAppCard: React.FC<Props> = ({
  origin: bazaarItem,
  className,
  featured = false,
  compact = false,
}) => {
  const origins = bazaarItem.origins;
  const addresses = bazaarItem.recipients;

  if (!origins || origins.length === 0) return null;

  const origin = origins[0];
  const hostname = safeGetHostname(origin.origin);
  const recipientAddress = addresses[0];

  // Check if origin has ogImages (only available in AggregatedItem)
  const ogImage =
    'ogImages' in origin && origin.ogImages && origin.ogImages.length > 0
      ? origin.ogImages[0]
      : null;

  return (
    <Link
      href={recipientAddress ? `/recipient/${recipientAddress}/resources` : '#'}
    >
      <Card
        className={cn(
          'overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group h-full',
          featured && 'border-2 border-primary/20',
          className
        )}
      >
        {/* Header Image or Placeholder */}
        <div
          className={cn(
            'relative bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center overflow-hidden',
            featured ? 'h-24' : compact ? 'h-20' : 'h-24'
          )}
        >
          {ogImage ? (
            <>
              <Image
                src={ogImage.url}
                alt={ogImage.title ?? hostname}
                fill
                unoptimized
                className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            </>
          ) : (
            <div className="flex items-center justify-center">
              {origin.favicon ? (
                <Favicon
                  url={origin.favicon}
                  className={cn(
                    featured ? 'size-10' : compact ? 'size-7' : 'size-8'
                  )}
                />
              ) : (
                <Globe
                  className={cn(
                    featured ? 'size-10' : compact ? 'size-7' : 'size-8'
                  )}
                />
              )}
            </div>
          )}

          {featured && (
            <Badge className="absolute top-1.5 right-1.5 text-xs z-10">
              Featured
            </Badge>
          )}
        </div>

        <CardHeader className={cn(compact ? 'pb-1.5 pt-3' : 'pb-2 pt-4')}>
          <div className="flex items-center gap-2">
            {origin.favicon ? (
              <Favicon
                url={origin.favicon}
                className={compact ? 'size-4' : 'size-5'}
              />
            ) : (
              <Globe className={compact ? 'size-4' : 'size-5'} />
            )}
            <CardTitle
              className={cn(
                'line-clamp-1 group-hover:text-primary transition-colors font-mono',
                featured ? 'text-base' : 'text-sm'
              )}
            >
              {hostname}
            </CardTitle>
          </div>

          {origin.title && !compact && (
            <CardDescription className="line-clamp-1 text-xs">
              {origin.title}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className={cn(compact ? 'pt-0 pb-3.5' : 'pt-0 pb-4')}>
          <div className="space-y-2">
            {addresses.length > 0 && (
              <Addresses
                addresses={addresses}
                className="border-none p-0 text-[10px] md:text-xs"
                hideTooltip
              />
            )}

            {origin.description && !compact && (
              <p className="text-xs text-muted-foreground/60 line-clamp-2">
                {origin.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
