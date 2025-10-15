import React from 'react';
import { OriginAppCard } from './origin-app-card';
import { cn } from '@/lib/utils';

import type { RouterOutputs } from '@/trpc/client';

interface Props {
  origins: RouterOutputs['origins']['list']['withResources']['all'];
  className?: string;
}

export const AppStoreGrid: React.FC<Props> = ({ origins, className }) => {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
      className
    )}>
      {origins.map((origin) => (
        <OriginAppCard 
          key={origin.id} 
          origin={origin}
        />
      ))}
    </div>
  );
};
