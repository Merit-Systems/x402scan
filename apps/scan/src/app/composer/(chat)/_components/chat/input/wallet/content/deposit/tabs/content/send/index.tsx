import { useState } from 'react';

import { TokenInput } from '@/components/ui/token/token-input';

import { usdc } from '@/lib/tokens/usdc';

import { Chain } from '@/types/chain';
import { SendToServerWalletEVM } from './evm';
import { SendToServerWalletSolana } from './svm';

import type { SupportedChain } from '@/types/chain';
import { useConnectedWallets } from '@/app/_hooks/use-connected-wallets';
import { SendNotConnected } from './not-connected';

interface Props {
  chain: SupportedChain;
  onSuccess?: () => void;
}

export const SendToServerWallet: React.FC<Props> = ({ chain, onSuccess }) => {
  const [amount, setAmount] = useState(0);

  const { solanaAddress, evmAddress } = useConnectedWallets();

  if (
    (chain === Chain.SOLANA && !solanaAddress) ||
    (chain !== Chain.SOLANA && !evmAddress)
  ) {
    return <SendNotConnected chain={chain} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <TokenInput
          onChange={setAmount}
          selectedToken={usdc(chain)}
          label="Amount"
          placeholder="0.00"
          inputClassName="placeholder:text-muted-foreground/60"
          isBalanceMax
          chain={chain}
        />
      </div>
      {chain === Chain.SOLANA ? (
        <SendToServerWalletSolana amount={amount} onSuccess={onSuccess} />
      ) : (
        <SendToServerWalletEVM
          amount={amount}
          chain={chain}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
};
