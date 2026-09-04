"use client";

import { useState } from "react";

import Image from "next/image";

import { AlertTriangle, Download, Eye, EyeOff, Loader2 } from "lucide-react";

import { useMutation } from "@tanstack/react-query";

import {
  useExportEvmAccount,
  useExportSolanaAccount,
} from "@coinbase/cdp-hooks";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CopyCode } from "@/components/ui/copy-code";

import { useWalletChain } from "@/app/(app)/composer/_contexts/wallet-chain/hook";

import { Chain } from "@/types/chain";

import type { Address } from "viem";

interface Props {
  address: string;
}

export const ExportWallet: React.FC<Props> = ({ address }) => {
  const { chain } = useWalletChain();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const { exportEvmAccount } = useExportEvmAccount();
  const { exportSolanaAccount } = useExportSolanaAccount();

  const {
    mutate: handleConfirmedExport,
    isPending: isExporting,
    reset,
    data: privateKey,
  } = useMutation({
    mutationFn: async () => {
      const { privateKey } =
        chain === Chain.SOLANA
          ? await exportSolanaAccount({
              solanaAccount: address,
            })
          : await exportEvmAccount({
              evmAccount: address as Address,
            });
      await navigator.clipboard.writeText(privateKey);
      return privateKey;
    },
    onSuccess: () => {
      setIsRevealed(true);
      setShowConfirmation(false);
      toast.success("Private key copied to clipboard", {
        description: "Please store it securely and clear your clipboard.",
      });
    },
    onError: (error) => {
      setShowConfirmation(false);
      toast.error("Failed to export private key", {
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while exporting your private key.",
      });
    },
  });

  const handleExportRequest = () => {
    setShowConfirmation(true);
  };

  const handleClear = () => {
    reset();
    setIsRevealed(false);
    setShowConfirmation(false);
  };

  const handleExportClick = () => {
    if (!address) {
      toast.error("No wallet address found", {
        description: "Please ensure you are logged in with an embedded wallet.",
      });
      setShowConfirmation(false);
      return;
    }
    handleConfirmedExport();
  };

  return (
    <div className="flex flex-col gap-4">
      {showConfirmation ? (
        <>
          <div className="flex items-start gap-3 rounded-lg border border-red-600/20 bg-red-600/10 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-red-600">
                Security Warning
              </p>
              <p className="text-sm font-medium">
                Exporting your private key is a high-risk operation.
              </p>
              <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                <li>
                  Anyone with your private key has complete control of your
                  wallet
                </li>
                <li>Never share your private key with anyone</li>
              </ul>
              <p className="text-sm font-medium">
                Do you understand these risks and want to proceed?
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowConfirmation(false)}
              variant="outline"
              className="flex-1"
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportClick}
              disabled={isExporting || !address}
              variant="destructive"
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Yes, Export Private Key"
              )}
            </Button>
          </div>
        </>
      ) : privateKey ? (
        <>
          <div className="flex items-start gap-3 rounded-lg border border-yellow-600/20 bg-yellow-600/10 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-yellow-600" />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-yellow-600">
                Warning: Keep your key safe
              </p>
              <p className="text-xs text-muted-foreground">
                Your private key has been copied to clipboard.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Private Key</span>
              <Button
                onClick={() => setIsRevealed(!isRevealed)}
                variant="ghost"
                size="sm"
                className="h-8"
              >
                {isRevealed ? (
                  <>
                    <EyeOff className="size-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="size-4" />
                    Reveal
                  </>
                )}
              </Button>
            </div>
            {isRevealed ? (
              <CopyCode
                code={privateKey}
                toastMessage="Private key copied to clipboard"
                className="max-h-64 overflow-auto"
              />
            ) : (
              <div className="rounded-md border bg-muted p-4 text-center">
                <p className="font-mono text-sm text-muted-foreground">
                  ••••••••
                </p>
              </div>
            )}
          </div>

          <Button onClick={handleClear} variant="outline" className="w-full">
            Clear
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <Image
                src="/coinbase.png"
                alt="Base"
                height={16}
                width={16}
                className="mr-1 inline-block size-4 rounded-full"
              />
              <span className="text-sm font-bold">Export Wallet</span>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-red-600/20 bg-red-600/10 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-600" />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-red-600">
                Warning: Keep your keys safe
              </p>
              <p className="text-xs text-muted-foreground">
                Never share your private key with anyone. Anyone with access to
                it can access your funds.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Export your private key to backup or import into another wallet.
          </p>

          <Button
            onClick={handleExportRequest}
            variant="outline"
            disabled={!address}
            className="w-full"
          >
            <Download className="size-4" />
            Export Private Key
          </Button>
        </>
      )}
    </div>
  );
};
