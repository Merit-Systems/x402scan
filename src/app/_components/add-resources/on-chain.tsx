'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Address } from 'viem';

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

import { useAddResource } from '@/hooks/on-chain/use-registry';
import type { Resource } from '@/hooks/on-chain/types';

export const AddOnChainResourceDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<
    Omit<Resource, 'maxAmountRequired'> & { maxAmountRequired: string }
  >({
    scheme: '',
    network: '',
    maxAmountRequired: '',
    resource: '',
    description: '',
    mimeType: '',
    outputSchema: '',
    payTo: '' as Address,
    maxTimeoutSeconds: 0,
    asset: '' as Address,
    extra: '',
  });

  const { addResource } = useAddResource();
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsPending(true);
      await addResource({
        ...formData,
        maxAmountRequired: BigInt(formData.maxAmountRequired),
        payTo: formData.payTo,
        asset: formData.asset,
      });
      toast.success('Resource added to on-chain registry successfully');
      setIsOpen(false);
      // Reset form
      setFormData({
        scheme: '',
        network: '',
        maxAmountRequired: '',
        resource: '',
        description: '',
        mimeType: '',
        outputSchema: '',
        payTo: '' as Address,
        maxTimeoutSeconds: 0,
        asset: '' as Address,
        extra: '',
      });
    } catch (error) {
      toast.error('Failed to add resource to on-chain registry');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    formData.scheme &&
    formData.network &&
    formData.maxAmountRequired &&
    formData.resource &&
    formData.payTo &&
    formData.asset;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4" />
          On-Chain
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0 overflow-hidden gap-0 max-h-[90vh]">
        <DialogHeader className="bg-muted border-b p-4">
          <DialogTitle>Add Resource On-Chain</DialogTitle>
          <DialogDescription>
            Register a new x402 resource directly to the blockchain registry.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Scheme *</Label>
              <Input
                type="text"
                placeholder="http"
                value={formData.scheme}
                onChange={e => updateField('scheme', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Network *</Label>
              <Input
                type="text"
                placeholder="mainnet"
                value={formData.network}
                onChange={e => updateField('network', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Resource URL *</Label>
            <Input
              type="text"
              placeholder="https://example.com/api/resource"
              value={formData.resource}
              onChange={e => updateField('resource', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Description</Label>
            <Input
              type="text"
              placeholder="Resource description"
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Max Amount Required *</Label>
              <Input
                type="text"
                placeholder="1000000000000000000"
                value={formData.maxAmountRequired}
                onChange={e => updateField('maxAmountRequired', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Max Timeout (seconds)</Label>
              <Input
                type="number"
                placeholder="60"
                value={formData.maxTimeoutSeconds}
                onChange={e =>
                  updateField(
                    'maxTimeoutSeconds',
                    parseInt(e.target.value) || 0
                  )
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Pay To Address *</Label>
            <Input
              type="text"
              placeholder="0x..."
              value={formData.payTo}
              onChange={e => updateField('payTo', e.target.value as Address)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Asset Address *</Label>
            <Input
              type="text"
              placeholder="0x..."
              value={formData.asset}
              onChange={e => updateField('asset', e.target.value as Address)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>MIME Type</Label>
              <Input
                type="text"
                placeholder="application/json"
                value={formData.mimeType}
                onChange={e => updateField('mimeType', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label>Output Schema</Label>
              <Input
                type="text"
                placeholder="JSON schema"
                value={formData.outputSchema}
                onChange={e => updateField('outputSchema', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Extra</Label>
            <Input
              type="text"
              placeholder="Additional data"
              value={formData.extra}
              onChange={e => updateField('extra', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="bg-muted border-t p-4">
          <Button
            variant="turbo"
            disabled={isPending || !isFormValid}
            onClick={handleSubmit}
            className="w-full"
          >
            {isPending ? 'Adding to blockchain...' : 'Add to Registry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
