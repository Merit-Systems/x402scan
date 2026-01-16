import { Separator } from '@/components/ui/separator';

import { cn } from '@/lib/utils';

interface Props {
  text: string;
  containerClassName?: string;
  separatorClassName?: string;
  textClassName?: string;
  separatorProps?: React.ComponentProps<typeof Separator>;
}

export const TextSeparator: React.FC<Props> = ({
  text,
  containerClassName,
  separatorClassName,
  textClassName,
  separatorProps,
}) => {
  return (
    <div className={cn('flex items-center gap-2', containerClassName)}>
      <Separator
        className={cn('flex-1', separatorClassName)}
        {...separatorProps}
      />
      <p className={cn('text-muted-foreground text-xs', textClassName)}>
        {text}
      </p>
      <Separator
        className={cn('flex-1', separatorClassName)}
        {...separatorProps}
      />
    </div>
  );
};
