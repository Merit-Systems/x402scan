import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

export const Separator = ({ className }: Props) => {
  return <p className={cn('text-muted-foreground/20 text-xl', className)}>/</p>;
};
