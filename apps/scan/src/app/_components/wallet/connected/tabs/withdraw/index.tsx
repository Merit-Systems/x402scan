import { useState } from 'react';

import Image from 'next/image';

import { Input } from '@/components/ui/input';
import { TokenInput } from '@/components/ui/token/token-input';

import { useWalletChain } from '../../../chain-context/hook';

import { usdc } from '@/lib/tokens/usdc';

import { Chain, CHAIN_ICONS, CHAIN_LABELS } from '@/types/chain';
import { WithdrawEVM } from './evm';
import { WithdrawSolana } from './svm';

interface Props {
  address: string;
}

export const Withdraw: React.FC<Props> = ({ address }) => {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState(0);

  const { chain } = useWalletChain();

  return (
    <div className="flex flex-col gap-4">
      <div className="gap-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Image
            src={CHAIN_ICONS[chain]}
            alt={CHAIN_LABELS[chain]}
            height={16}
            width={16}
            className="size-4 inline-block mr-1 rounded-full"
          />
          <span className="font-bold text-sm">
            Send USDC on {CHAIN_LABELS[chain]}
          </span>
        </div>
      </div>
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
      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">Address</span>
        <Input
          placeholder={chain === Chain.BASE ? '0x...' : 'Solana Address'}
          value={toAddress}
          onChange={e => setToAddress(e.target.value)}
          className="border-2 shadow-none placeholder:text-muted-foreground/60 font-mono"
        />
      </div>
      {chain === Chain.BASE ? (
        <WithdrawEVM
          address={address}
          amount={amount}
          toAddress={toAddress}
          setAmount={setAmount}
        />
      ) : (
        <WithdrawSolana
          amount={amount}
          setAmount={setAmount}
          toAddress={toAddress}
        />
      )}
    </div>
  );
};
