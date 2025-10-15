import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Favicon } from '@/components/favicon';
import { cn } from '@/lib/utils';

import type { OgImage, ResourceOrigin } from '@prisma/client';

interface Props {
  origin: ResourceOrigin & {
    ogImages: OgImage[];
    resources: { 
      id: string;
      accepts: { payTo: string }[];
    }[];
  };
  className?: string;
  featured?: boolean;
  compact?: boolean;
}

export const OriginAppCard: React.FC<Props> = ({ 
  origin, 
  className,
  featured = false,
  compact = false
}) => {
  const hostname = new URL(origin.origin).hostname;
  // Get the first payTo address from the first resource for routing
  const recipientAddress = origin.resources[0]?.accepts[0]?.payTo;
  
  return (
    <Link href={recipientAddress ? `/recipient/${recipientAddress}/resources` : '#'}>
      <Card className={cn(
        'overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group h-full',
        featured && 'border-2 border-primary/20',
        className
      )}>
        {/* Header Image or Placeholder */}
        <div className={cn(
          'relative bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center',
          featured ? 'h-24' : compact ? 'h-20' : 'h-20'
        )}>
          {origin.ogImages.length > 0 ? (
            <img
              src={origin.ogImages[0].url}
              alt={origin.ogImages[0].title ?? ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center">
              <Favicon 
                url={origin.favicon} 
                className={cn(
                  featured ? 'size-10' : compact ? 'size-7' : 'size-8'
                )}
              />
            </div>
          )}
          
          {featured && (
            <Badge className="absolute top-1.5 right-1.5 text-xs">
              Featured
            </Badge>
          )}
        </div>

        <CardHeader className={cn(compact ? 'pb-1.5 pt-3' : 'pb-2 pt-4')}>
          <div className="flex items-center gap-2">
            <Favicon url={origin.favicon} className={compact ? 'size-4' : 'size-5'} />
            <CardTitle className={cn(
              'line-clamp-1 group-hover:text-primary transition-colors',
              featured ? 'text-base' : 'text-sm'
            )}>
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
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {origin.resources.length} resource{origin.resources.length !== 1 ? 's' : ''}
            </Badge>
            
            {origin.description && !compact && (
              <p className="text-xs text-muted-foreground/60 line-clamp-1 flex-1 ml-2">
                {origin.description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
