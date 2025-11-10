import { useState } from 'react';

import { TokenInput } from '@/components/ui/token/token-input';

import { usdc } from '@/lib/tokens/usdc';

import { Chain } from '@/types/chain';
import { SendToServerWalletEVM } from './evm';
import { SendToServerWalletSolana } from './svm';

import type { SupportedChain } from '@/types/chain';

interface Props {
  chain: SupportedChain;
  onSuccess?: () => void;
}

export const SendToServerWallet: React.FC<Props> = ({ chain, onSuccess }) => {
  const [amount, setAmount] = useState(0);

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
      {chain === Chain.BASE ? (
        <SendToServerWalletEVM
          amount={amount}
          chain={chain}
          onSuccess={onSuccess}
        />
      ) : (
        <SendToServerWalletSolana amount={amount} onSuccess={onSuccess} />
      )}
    </div>
  );
};
