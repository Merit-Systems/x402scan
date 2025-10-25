'use client';

import { useState } from 'react';
import { useExportEvmAccount } from '@coinbase/cdp-hooks';
import { Button } from '@/components/ui/button';
import { CopyCode } from '@/components/ui/copy-code';
import { AlertTriangle, Download, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import type { Address } from 'viem';

interface Props {
  accountAddress: Address;
}

export const ExportWallet: React.FC<Props> = ({ accountAddress }) => {
  const { exportEvmAccount } = useExportEvmAccount();
  const [isExporting, setIsExporting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const handleExportRequest = () => {
    setShowConfirmation(true);
  };

  const handleConfirmedExport = async () => {
    if (!accountAddress) {
      toast.error('No wallet address found', {
        description: 'Please ensure you are logged in with an embedded wallet.',
      });
      setShowConfirmation(false);
      return;
    }

    setIsExporting(true);
    const { privateKey } = await exportEvmAccount({
      evmAccount: accountAddress,
    });

    await navigator.clipboard.writeText(privateKey);
    setPrivateKey(privateKey);
    setIsRevealed(true);
    setShowConfirmation(false);
    setIsExporting(false);

    toast.success('Private key copied to clipboard', {
      description: 'Please store it securely and clear your clipboard.',
    });
  };

  const handleClear = () => {
    setPrivateKey(null);
    setIsRevealed(false);
    setShowConfirmation(false);
  };

  if (showConfirmation) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-red-600">
              Security Warning
            </p>
            <p className="text-sm font-medium">
              Exporting your private key is a high-risk operation.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                Anyone with your private key has complete control of your wallet
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
            onClick={handleConfirmedExport}
            disabled={isExporting || !accountAddress}
            variant="destructive"
            className="flex-1"
          >
            {isExporting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Exporting...
              </>
            ) : (
              'Yes, Export Private Key'
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (privateKey) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
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
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">Private Key</span>
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
            <div className="border rounded-md p-4 bg-muted text-center">
              <p className="text-sm text-muted-foreground font-mono">
                ••••••••
              </p>
            </div>
          )}
        </div>

        <Button onClick={handleClear} variant="outline" className="w-full">
          Clear
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="gap-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Image
            src="/coinbase.png"
            alt="Base"
            height={16}
            width={16}
            className="size-4 inline-block mr-1 rounded-full"
          />
          <span className="font-bold text-sm">Export Wallet</span>
        </div>
      </div>
      <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="size-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-yellow-600">
            Warning: Keep your keys safe
          </p>
          <p className="text-xs text-muted-foreground">
            Never share your private key with anyone. Anyone with access to it
            can access your funds.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Export your private key to backup or import into another wallet.
      </p>

      <Button
        onClick={handleExportRequest}
        variant="outline"
        disabled={!accountAddress}
        className="w-full"
      >
        <Download className="size-4" />
        Export Private Key
      </Button>
    </div>
  );
};
