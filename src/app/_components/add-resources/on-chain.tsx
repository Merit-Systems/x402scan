'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useAddResource } from '@/hooks/use-registry';
import { api } from '@/trpc/client';

export const AddOnChainResourceDialog = () => {
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [resourceUrl, setResourceUrl] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [walletMismatchError, setWalletMismatchError] = useState<string | null>(null);

  const { addResource } = useAddResource();
  const { mutateAsync: fetchMetadata } = api.resources.register.useMutation();

  // Parse maxAmountRequired from formatted string (e.g., "$0.01") to USDC smallest unit
  const parseDollarAmount = (formatted: string): string => {
    const cleaned = formatted.replace(/[$,\s]/g, '');
    const amount = parseFloat(cleaned);
    if (isNaN(amount)) return '0';
    return Math.floor(amount * 1_000_000).toString();
  };

  const handleAddToRegistry = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!resourceUrl) {
      toast.error('Please enter a resource URL');
      return;
    }

    setIsPending(true);
    setWalletMismatchError(null);

    try {
      // Step 1: Fetch metadata and register off-chain
      const data = await fetchMetadata({
        url: resourceUrl,
        headers: {},
      });

      // Check if connected wallet matches payTo address
      const payToAddress = (data.accepts.payTo as Address).toLowerCase();
      if (address.toLowerCase() !== payToAddress) {
        setWalletMismatchError(
          `This resource expects payment to ${data.accepts.payTo}, but your connected wallet is ${address}. Please connect the correct wallet.`
        );
        setIsPending(false);
        return;
      }

      // Step 2: Add to on-chain registry
      await addResource({
        scheme: data.accepts.scheme ?? '',
        network: data.accepts.network.replace('_', '-'),
        maxAmountRequired: BigInt(parseDollarAmount(data.accepts.maxAmountRequired)),
        resource: data.resource.resource,
        description: data.accepts.description ?? '',
        mimeType: data.accepts.mimeType ?? 'application/json',
        outputSchema: data.accepts.outputSchema
          ? JSON.stringify(data.accepts.outputSchema)
          : '',
        payTo: data.accepts.payTo as Address,
        maxTimeoutSeconds: data.accepts.maxTimeoutSeconds ?? 0,
        asset: (data.accepts.asset as Address) ?? ('' as Address),
        extra: data.accepts.extra
          ? typeof data.accepts.extra === 'string'
            ? data.accepts.extra
            : JSON.stringify(data.accepts.extra)
          : '',
      });

      toast.success('Resource added to on-chain registry successfully');
      setIsOpen(false);
      setResourceUrl('');
      setWalletMismatchError(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to add resource to on-chain registry'
      );
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setWalletMismatchError(null);
          setResourceUrl('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4" />
          On-Chain
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 overflow-hidden gap-0">
        <DialogHeader className="bg-muted border-b p-4">
          <DialogTitle>Add Resource On-Chain</DialogTitle>
          <DialogDescription>
            Enter a resource URL to fetch metadata and register it on-chain.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label>Resource URL *</Label>
            <Input
              type="text"
              placeholder="https://example.com/api/resource"
              value={resourceUrl}
              onChange={e => {
                setResourceUrl(e.target.value);
                setWalletMismatchError(null);
              }}
            />
            {!address && (
              <p className="text-xs text-amber-600">
                ⚠️ Connect your wallet to continue
              </p>
            )}
            {walletMismatchError && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-1">
                <p className="font-medium">❌ Wallet Mismatch</p>
                <p className="mt-1">{walletMismatchError}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              We&apos;ll automatically fetch the x402 metadata and register it
              on-chain using your connected wallet address.
            </p>
          </div>
        </div>

        <DialogFooter className="bg-muted border-t p-4">
          <Button
            variant="turbo"
            disabled={isPending || !resourceUrl || !address}
            onClick={handleAddToRegistry}
            className="w-full"
          >
            {isPending ? 'Adding to blockchain...' : 'Add to Registry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
