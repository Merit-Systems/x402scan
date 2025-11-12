import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Props {
  className?: string;
  prefix?: string;
  icon?: string;
  name?: string;
  isPending?: boolean;
  onClick?: () => void;
}

export const ConnectInjectedWalletButton: React.FC<Props> = ({
  className,
  prefix = 'Connect',
  icon,
  name,
  isPending,
  onClick,
}) => {
  return (
    <Button
      variant="outline"
      className={cn('user-message w-full h-12 md:h-12', className)}
      onClick={onClick}
      disabled={isPending}
    >
      {icon && !isPending && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt={name} className="size-4" />
      )}
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {prefix ? `${prefix} ${name}` : name}
    </Button>
  );
};
