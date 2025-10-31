import React from 'react';

import type { Tag } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  tags: Tag[];
  className?: string;
  badgeClassName?: string;
}

export const Tags: React.FC<Props> = ({ tags, className, badgeClassName }) => {
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {tags.map(tag => (
        <Badge
          key={tag.id}
          className={cn('text-[10px] size-fit px-2 py-0', badgeClassName)}
          variant="primaryOutline"
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  );
};
