import React from 'react';
import { Carousel } from './carousel';
import { OriginAppCard } from './origin-app-card';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  title: string;
  origins: RouterOutputs['sellers']['list']['bazaar']['items'];
  featured?: boolean;
  compact?: boolean;
  autoplay?: boolean;
}

export const OriginCarousel: React.FC<Props> = ({ 
  title, 
  origins, 
  featured = false,
  compact = false,
  autoplay = true 
}) => {
  if (origins.length === 0) return null;

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <Carousel autoplay={autoplay} compact={compact}>
        {origins.map((item) => (
          <OriginAppCard 
            key={item.origins[0]?.id ?? item.recipients[0]} 
            origin={item}
            featured={featured}
            compact={compact}
            className="mr-4"
          />
        ))}
      </Carousel>
    </div>
  );
};
