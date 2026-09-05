"use client";

import Image from "next/image";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Logo } from "@/components/ui/logo";

import type { RouterOutputs } from "@/trpc/client";
import { Verify } from "./verify";
import { ConnectWalletForm } from "@/app/(app)/composer/_components/wallet/connect/form";
import { WalletChainProvider } from "@/app/(app)/composer/_contexts/wallet-chain/provider";
import { useConnectedWallets } from "@/app/(app)/composer/_hooks/use-connected-wallets";

interface Props {
  agentConfig?: NonNullable<RouterOutputs["public"]["agents"]["get"]>;
}

export const ConnectDialog: React.FC<Props> = ({ agentConfig }) => {
  const connectedWallets = useConnectedWallets();

  return (
    <WalletChainProvider>
      <AlertDialog open={true}>
        <AlertDialogContent className="overflow-hidden">
          <AlertDialogHeader className="flex flex-row items-center gap-2 space-y-0">
            {agentConfig?.image ? (
              <Image
                src={agentConfig.image}
                alt={agentConfig.name}
                width={48}
                height={48}
                className="size-12 rounded-full"
              />
            ) : (
              <Logo className="size-12" />
            )}
            <div>
              <AlertDialogTitle>
                {agentConfig
                  ? `Welcome to ${agentConfig.name}`
                  : "Welcome to x402scan Composer"}
              </AlertDialogTitle>
              <AlertDialogDescription className=" ">
                {agentConfig?.description ??
                  "A playground for building agents that use x402 resources"}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          {connectedWallets.isConnected ? (
            <Verify connectedWallets={connectedWallets} />
          ) : (
            <div className="flex flex-col gap-4 p-4">
              <ConnectWalletForm />
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </WalletChainProvider>
  );
};
