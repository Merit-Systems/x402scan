import { cn } from '@/lib/utils';

export function Shortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="shortcut"
      className={cn(
        'text-muted-foreground ml-auto text-xs tracking-widest',
        className
      )}
      {...props}
    />
  );
}
