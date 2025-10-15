import React from 'react';
import { Carousel } from './carousel';
import { OriginAppCard } from './origin-app-card';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  featuredOrigins: RouterOutputs['origins']['list']['withResources']['all'];
}

export const FeaturedCarousel: React.FC<Props> = ({ featuredOrigins }) => {
  if (featuredOrigins.length === 0) return null;

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Featured Resources</h2>
      <Carousel autoplay>
        {featuredOrigins.map((origin) => (
          <OriginAppCard 
            key={origin.id} 
            origin={origin}
            featured
            className="mr-4"
          />
        ))}
      </Carousel>
    </div>
  );
};
