'use client';

import { Key, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { api } from '@/trpc/client';
import { CopyCode } from '@/components/ui/copy-code';

export const ExportWallet = () => {
  const {
    mutate: exportWallet,
    isPending: isExporting,
    data: privateKey,
    isSuccess: isExported,
  } = api.serverWallet.export.useMutation();

  return (
    <div className="flex flex-col gap-4">
      <div className="px-4">
        {privateKey ? (
          <CopyCode
            code={privateKey}
            toastMessage="Private key copied to clipboard"
          />
        ) : (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => exportWallet()}
            disabled={isExporting || isExported}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Key className="size-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export Private Key'}
          </Button>
        )}
      </div>
      <div className="p-4 bg-muted border-t">
        <p className="text-muted-foreground text-xs text-center font-mono">
          This will export your private key for you to use with other wallets.
          We will never ask you to share your private key.
        </p>
      </div>
    </div>
  );
};
