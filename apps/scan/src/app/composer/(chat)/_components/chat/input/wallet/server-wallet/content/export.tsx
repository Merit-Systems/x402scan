'use client';

import { Button } from '@/components/ui/button';
import { CopyCode } from '@/components/ui/copy-code';
import { api } from '@/trpc/client';
import { Key } from 'lucide-react';
import { toast } from 'sonner';

export const WalletExport: React.FC = () => {
  const {
    mutate: exportWallet,
    isPending: isExporting,
    data: exportData,
  } = api.user.serverWallet.export.useMutation();

  const handleExport = () => {
    exportWallet(undefined, {
      onSuccess: () => {
        toast.success('Wallet exported');
      },
    });
  };

  if (exportData) {
    return (
      <div className="flex flex-col gap-4 items-center w-full overflow-hidden text-center">
        <CopyCode
          code={exportData}
          toastMessage="Private key copied to clipboard"
        />
        <p className="text-muted-foreground text-center text-xs font-mono">
          Do not share your private key with anyone. Anyone with access to it
          can access this wallet&apos;s funds.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-bold">
        This is a very sensitive operation. Do not export your wallet if someone
        asks you to.
      </p>
      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full"
        variant="warning"
      >
        <Key className="size-4" />
        Export Private Key
      </Button>
      <div className="text-muted-foreground text-center flex flex-col gap-2 text-xs font-mono">
        <p>Exporting your wallet will reveal the private key to you.</p>
      </div>
    </div>
  );
};
