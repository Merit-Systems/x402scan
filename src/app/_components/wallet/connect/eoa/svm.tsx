import { Button } from '@/components/ui/button';
import type { Wallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback } from 'react';

export const ConnectEOASolanaForm = () => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { wallets, select } = useWallet();

  const onConnect = useCallback(
    async (wallet: Wallet) => {
      if (!wallet.adapter.connected) {
        await wallet.adapter.connect();
      }
      void select(wallet.adapter.name);
    },
    [select]
  );

  if (wallets.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {wallets.map(wallet => (
        <Button key={wallet.adapter.name} onClick={() => onConnect(wallet)}>
          {wallet.adapter.name}
        </Button>
      ))}
    </div>
  );
};
