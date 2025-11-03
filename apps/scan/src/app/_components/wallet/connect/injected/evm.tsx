import { useCallback } from 'react';

import { Loader2 } from 'lucide-react';

import { useConnect } from 'wagmi';
import { base } from 'wagmi/chains';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

import type { Connector } from 'wagmi';

interface Props {
  className?: string;
  buttonClassName?: string;
  connectors: Connector[];
  prefix?: string;
}

export const ConnectEVMInjectedWallet: React.FC<Props> = ({
  connectors,
  className,
  buttonClassName,
  prefix,
}) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {connectors.map(connector => (
        <ConnectEVMInjectedWalletButton
          key={connector.id}
          connector={connector}
          className={buttonClassName}
          prefix={prefix}
        />
      ))}
    </div>
  );
};

interface ConnectEVMInjectedWalletButtonProps {
  connector: Connector;
  className?: string;
  prefix?: string;
}

const ConnectEVMInjectedWalletButton: React.FC<
  ConnectEVMInjectedWalletButtonProps
> = ({ connector, className, prefix }) => {
  const { connectAsync, isPending } = useConnect();

  const onConnect = useCallback(
    async (connector: Connector) => {
      await connectAsync(
        { connector, chainId: base.id },
        {
          onSuccess: () => {
            void toast.success('Connected to wallet');
          },
          onError: error => {
            void toast.error(error.message);
          },
        }
      );
    },
    [connectAsync]
  );

  return (
    <Button
      variant="outline"
      className={cn('user-message w-full', className)}
      onClick={() => onConnect(connector)}
      disabled={isPending}
    >
      {connector.icon && !isPending && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={connector.icon} alt={connector.name} className="size-4" />
      )}
      {isPending && <Loader2 className="size-4 animate-spin" />}
      {prefix ? `${prefix} ${connector.name}` : connector.name}
    </Button>
  );
};
