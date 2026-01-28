import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        primaryOutline:
          'border border-primary text-primary bg-transparent shadow-xs hover:bg-primary/20',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        capability:
          'border-transparent bg-muted text-muted-foreground hover:bg-muted/80',
        success: 'border-transparent bg-green-500/20 text-green-500',
        primary: 'border-transparent bg-primary/30 text-primary',
        glass: 'border-primary/60 bg-primary/10 text-primary',
        warning: 'border-transparent bg-yellow-500/20 text-yellow-500',
        fancy: cn(
          'relative overflow-hidden border bg-gradient-to-tr from-primary via-primary/80 to-primary text-white',
          // before: shimmer overlay
          'before:pointer-events-none before:absolute before:inset-0 before:rounded-none before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:opacity-80 motion-safe:before:animate-shimmer before:h-[200%] before:w-[200%] before:rounded-full before:-translate-y-1/4 before:z-20',
          // after: inner glow
          'after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_0_6px_0px_rgba(255,255,255,0.8)] after:z-10'
        ),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type BadgeProps = {} & React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
