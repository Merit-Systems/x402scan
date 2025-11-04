import { useCallback } from 'react';

import { useConnect } from 'wagmi';
import { base } from 'wagmi/chains';

import { toast } from 'sonner';

import { ConnectInjectedWalletButton } from './button';

import { cn } from '@/lib/utils';

import type { Connector } from 'wagmi';

interface Props {
  className?: string;
  buttonClassName?: string;
  connectors: Connector[];
  prefix?: string;
}

export const ConnectEVMInjectedWalletButtons: React.FC<Props> = ({
  connectors,
  className,
  buttonClassName,
  prefix,
}) => {
  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
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

  const onConnect = useCallback(async () => {
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
  }, [connectAsync, connector]);

  return (
    <ConnectInjectedWalletButton
      className={className}
      prefix={prefix}
      icon={connector.icon}
      name={connector.name}
      isPending={isPending}
      onClick={onConnect}
    />
  );
};
