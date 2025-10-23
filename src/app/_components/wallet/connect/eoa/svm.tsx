import { useSolana } from '@/app/_contexts/solana';
import { Button } from '@/components/ui/button';
import type { UiWallet } from '@wallet-standard/react';
import { useConnect } from '@wallet-standard/react';
import { toast } from 'sonner';

export const ConnectEOASolanaForm = () => {
  const { wallets } = useSolana();

  if (wallets.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {wallets.map(wallet => (
        <ConnectEOASolanaButton
          key={wallet.name}
          wallet={wallet}
          onConnect={() => {
            toast.success(`Connected to ${wallet.name}`);
          }}
        />
      ))}
    </div>
  );
};

const ConnectEOASolanaButton = ({
  wallet,
  onConnect,
}: {
  wallet: UiWallet;
  onConnect: () => void;
}) => {
  const { setWalletAndAccount } = useSolana();
  const [isConnecting, connect] = useConnect(wallet);

  const handleConnect = async () => {
    if (isConnecting) return;

    try {
      const accounts = await connect();

      if (accounts && accounts.length > 0) {
        const account = accounts[0];
        setWalletAndAccount(wallet, account);
        onConnect();
      }
    } catch (err) {
      console.error(`Failed to connect ${wallet.name}:`, err);
    }
  };

  return <Button onClick={handleConnect}>{wallet.name}</Button>;
};
