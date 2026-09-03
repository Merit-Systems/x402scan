import { useState } from "react";

import Image from "next/image";

import { Input } from "@/components/ui/input";
import { TokenInput } from "@/app/(app)/composer/_components/token/token-input";

import { useWalletChain } from "@/app/(app)/composer/_contexts/wallet-chain/hook";

import { usdc } from "@/lib/tokens/usdc";

import { Chain, CHAIN_ICONS, CHAIN_LABELS } from "@/types/chain";
import { WithdrawEVM } from "./evm";
import { WithdrawSolana } from "./svm";
import { WithdrawSuccess } from "./success";

export const Withdraw: React.FC = () => {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [isSuccessful, setIsSuccessful] = useState(false);

  const { chain } = useWalletChain();

  if (isSuccessful) {
    return (
      <WithdrawSuccess
        amount={amount}
        toAddress={toAddress}
        onReset={() => {
          setIsSuccessful(false);
          setToAddress("");
          setAmount(0);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <Image
            src={CHAIN_ICONS[chain]}
            alt={CHAIN_LABELS[chain]}
            height={16}
            width={16}
            className="mr-1 inline-block size-4 rounded-full"
          />
          <span className="text-sm font-bold">
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
        <span className="text-sm font-medium">Address</span>
        <Input
          placeholder={chain === Chain.SOLANA ? "Solana Address" : "0x..."}
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          className="border-2 font-mono shadow-none placeholder:text-muted-foreground/60"
        />
      </div>
      {chain === Chain.SOLANA ? (
        <WithdrawSolana
          amount={amount}
          toAddress={toAddress}
          onSuccess={() => {
            setIsSuccessful(true);
          }}
        />
      ) : (
        <WithdrawEVM
          amount={amount}
          toAddress={toAddress}
          onSuccess={() => {
            setIsSuccessful(true);
          }}
        />
      )}
    </div>
  );
};
