"use client";

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Logo } from "@/components/ui/logo";
import { ConnectWalletForm } from "./form";
import { WalletChain } from "../../../_contexts/wallet-chain/component";

export const ConnectWalletDialogContent = () => {
  return (
    <div className="flex max-w-full flex-col gap-4">
      <DialogHeader className="gap-2 border-b bg-muted">
        <div className="flex justify-between gap-2 p-4">
          <div className="flex flex-row items-center gap-2">
            <Logo className="size-6" />
            <div className="flex flex-col gap-2">
              <DialogTitle className="text-xl text-primary">
                Connect Wallet
              </DialogTitle>
              <DialogDescription className="hidden">
                This is your wallet.
              </DialogDescription>
            </div>
          </div>
          <WalletChain />
        </div>
      </DialogHeader>
      <div className="flex flex-col gap-6 p-4 pt-0">
        <ConnectWalletForm />
      </div>
    </div>
  );
};
