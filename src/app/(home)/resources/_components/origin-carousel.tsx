import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { OriginAppCard } from './origin-app-card';

import type { RouterOutputs } from '@/trpc/client';

type BazaarItem = RouterOutputs['sellers']['list']['bazaar']['items'][number];
type AggregatedItem =
  RouterOutputs['origins']['list']['aggregated']['items'][number];

interface Props {
  title: string;
  origins: BazaarItem[] | AggregatedItem[];
  featured?: boolean;
  compact?: boolean;
}

export const OriginCarousel: React.FC<Props> = ({
  title,
  origins,
  featured = false,
  compact = false,
}) => {
  if (origins.length === 0) return null;

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {origins.map(item => (
            <CarouselItem
              key={item.origins[0]?.id ?? item.recipients[0]}
              className={compact ? 'md:basis-1/3 lg:basis-1/4' : 'md:basis-1/2 lg:basis-1/3'}
            >
              <OriginAppCard
                origin={item}
                featured={featured}
                compact={compact}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};
