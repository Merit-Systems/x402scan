import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <span
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md block', className)}
      {...props}
    />
  );
}

export { Skeleton };
