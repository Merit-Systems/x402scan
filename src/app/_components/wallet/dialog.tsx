import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useCurrentUser } from '@coinbase/cdp-hooks';
import { useAccount } from 'wagmi';
import type { Addresses } from './display';
import { DisplayWalletDialogContent } from './display';
import { ConnectWalletDialogContent } from './connect';
import { useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';

import { useWalletAccountTransactionSendingSigner } from '@solana/react';
import { wrapFetchWithSolanaPayment } from '@/lib/x402/solana/fetch-with-payment';
import type { Address } from '@solana/kit';

interface Props {
  children: React.ReactNode;
}

export const WalletDialog: React.FC<Props> = ({ children }) => {
  const searchParams = useSearchParams();

  const { address } = useAccount();
  const { wallet, signTransaction, publicKey } = useWallet();

  useWalletAccountTransactionSendingSigner();

  const fetchWithSolanpPayment = wrapFetchWithSolanaPayment(
    fetch,
    publicKey?.toBase58() as Address,
    signTransaction
  );

  const { currentUser } = useCurrentUser();

  let addresses: Addresses | undefined = undefined;
  if (address && wallet?.adapter.publicKey) {
    addresses = {
      evm: address,
      svm: wallet.adapter.publicKey,
    };
  }
  if (address && !wallet?.adapter.publicKey) {
    addresses = {
      evm: address,
      svm: undefined,
    };
  }
  if (!address && wallet?.adapter.publicKey) {
    addresses = {
      evm: undefined,
      svm: wallet.adapter.publicKey,
    };
  }

  return (
    <Dialog defaultOpen={searchParams.get('onramp') === 'true'}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="p-0 overflow-hidden sm:max-w-sm"
        showCloseButton={false}
      >
        {addresses ? (
          <DisplayWalletDialogContent
            addresses={addresses}
            user={currentUser ?? undefined}
            defaultTab={
              searchParams.get('onramp') === 'true' ? 'deposit' : 'wallet'
            }
          />
        ) : (
          <ConnectWalletDialogContent />
        )}
      </DialogContent>
    </Dialog>
  );
};
