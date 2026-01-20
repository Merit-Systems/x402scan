import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BorderBeam } from '@/components/magicui/border-beam';

type Props = React.HTMLAttributes<HTMLDivElement>;

export function X402V2Badge({ className, ...props }: Props) {
  return (
    <Badge
      variant="fancy"
      className={cn(
        'text-xs font-bold size-fit px-2 py-0.5 relative overflow-hidden border-none',
        className
      )}
      {...props}
    >
      v2
      <BorderBeam
        size={30}
        colorFrom="rgba(255, 255, 255, 0)"
        colorTo="rgba(255, 255, 255)"
      />
    </Badge>
  );
}
