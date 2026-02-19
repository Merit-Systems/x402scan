import React from 'react';

import { Methods } from '@/types/x402';
import { cn } from '@/lib/utils';

interface Props {
  method?: Methods;
}

export const Method: React.FC<Props> = ({ method }) => {
  const methodClassName: Record<Methods, string> = {
    [Methods.GET]: 'bg-green-600/10 border border-green-600 text-green-600',
    [Methods.POST]: 'bg-blue-600/10 border border-blue-600 text-blue-600',
    [Methods.PUT]: 'bg-yellow-600/10 border border-yellow-600 text-yellow-600',
    [Methods.DELETE]: 'bg-red-600/10 border border-red-600 text-red-600',
    [Methods.PATCH]:
      'bg-purple-600/10 border border-purple-600 text-purple-600',
  };

  const undefinedMethodClassName =
    'bg-neutral-600/10 border border-neutral-600 text-neutral-600';

  return (
    <div
      className={cn(
        'font-mono px-1 rounded-md text-xs',
        method ? methodClassName[method] : undefinedMethodClassName
      )}
    >
      {method?.toUpperCase() ?? 'UNKNOWN'}
    </div>
  );
};
