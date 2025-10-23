import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useCurrentUser } from '@coinbase/cdp-hooks';
import { useAccount } from 'wagmi';
import type { Addresses } from './display';
import { DisplayWalletDialogContent } from './display';
import { ConnectWalletDialogContent } from './connect';
import { useSearchParams } from 'next/navigation';
import { useSolana } from '@/app/_contexts/solana';
import { PublicKey } from '@solana/web3.js';

interface Props {
  children: React.ReactNode;
}

export const WalletDialog: React.FC<Props> = ({ children }) => {
  const searchParams = useSearchParams();

  const { address } = useAccount();
  const { selectedAccount } = useSolana();

  const { currentUser } = useCurrentUser();

  let addresses: Addresses | undefined = undefined;
  if (address && selectedAccount?.address) {
    addresses = {
      evm: address,
      svm: new PublicKey(selectedAccount.publicKey),
    };
  }
  if (address && !selectedAccount?.address) {
    addresses = {
      evm: address,
      svm: undefined,
    };
  }
  if (!address && selectedAccount?.address) {
    addresses = {
      evm: undefined,
      svm: new PublicKey(selectedAccount.publicKey),
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
