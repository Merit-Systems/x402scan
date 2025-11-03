import { Loader2 } from 'lucide-react';

import { useConnect } from '@wallet-standard/react';

import { Button } from '@/components/ui/button';

import { useSolanaWallet } from '@/app/_contexts/solana/hook';

import { cn } from '@/lib/utils';

import type { UiWallet } from '@wallet-standard/react';

interface Props {
  className?: string;
  buttonClassName?: string;
  wallets: readonly UiWallet[];
  prefix?: string;
}

export const ConnectSVMInjectedWallet: React.FC<Props> = ({
  wallets,
  className,
  buttonClassName,
  prefix,
}) => {
  console.log(
    wallets.filter(wallet => wallet.chains.includes(`solana:mainnet`))
  );

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      {wallets.map(wallet => (
        <ConnectSVMInjectedWalletButton
          key={wallet.name}
          wallet={wallet}
          className={buttonClassName}
          prefix={prefix}
        />
      ))}
    </div>
  );
};

interface ConnectSVMInjectedWalletButtonProps {
  wallet: UiWallet;
  className?: string;
  prefix?: string;
}

const ConnectSVMInjectedWalletButton: React.FC<
  ConnectSVMInjectedWalletButtonProps
> = ({ wallet, className, prefix }) => {
  const [isConnecting, connect] = useConnect(wallet);
  const { setConnectedWallet } = useSolanaWallet();

  const handleConnect = async () => {
    try {
      const connectedAccount = await connect();
      if (!connectedAccount.length) {
        console.warn(`Connect to ${wallet.name} but there are no accounts.`);
        return connectedAccount;
      }

      const first = connectedAccount[0];
      setConnectedWallet({ account: first, wallet });
      return connectedAccount;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <Button
      variant="outline"
      className={cn('w-full', className)}
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : wallet.icon ? (
        <img src={wallet.icon} alt={wallet.name} className="size-4" />
      ) : null}
      {prefix ? `${prefix} ${wallet.name}` : wallet.name}
    </Button>
  );
};
