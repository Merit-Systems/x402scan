'use client';

import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const Actions = ({ className, children, ...props }: ComponentProps<'div'>) => (
  <div className={cn('flex items-center gap-1 -ml-1', className)} {...props}>
    {children}
  </div>
);

const Action = ({
  tooltip,
  children,
  label,
  className,
  variant = 'ghost',
  size = 'icon',
  ...props
}: ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
}) => {
  const button = (
    <Button
      className={cn(
        'relative size-fit md:size-fit p-1.5 text-muted-foreground hover:text-foreground',
        className
      )}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children}
      <span className="sr-only">{label ?? tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

export { Actions, Action };
