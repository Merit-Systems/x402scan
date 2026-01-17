import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Props = React.HTMLAttributes<HTMLDivElement>;

export function X402V2Badge({ className, ...props }: Props) {
  return (
    <Badge
      variant="fancy"
      className={cn('text-[10px] size-fit px-2 py-0', className)}
      {...props}
    >
      v2
    </Badge>
  );
}
