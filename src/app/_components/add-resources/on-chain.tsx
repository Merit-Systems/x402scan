'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Address } from 'viem';
import { useAccount } from 'wagmi';
import { z } from 'zod';

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
import { ethereumAddressSchema } from '@/lib/schemas';
import { api } from '@/trpc/client';

// Validation schema for the form
const resourceFormSchema = z.object({
  scheme: z.string().min(1, 'Scheme is required'),
  network: z.string().min(1, 'Network is required'),
  maxAmountRequired: z.string().regex(/^\d+$/, 'Must be a valid number'),
  resource: z.string().url({ message: 'Must be a valid URL' }),
  description: z.string().min(1, 'Description is required'),
  mimeType: z.string().min(1, 'MIME type is required'),
  outputSchema: z.string().min(1, 'Output schema is required'),
  payTo: ethereumAddressSchema,
  maxTimeoutSeconds: z.number().positive('Must be greater than 0'),
  asset: ethereumAddressSchema,
  extra: z.string().optional(),
});

export const AddOnChainResourceDialog = () => {
  const { address } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const [resourceUrl, setResourceUrl] = useState('');
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

  // Pre-fill pay-to address when wallet is connected
  useEffect(() => {
    if (address && !formData.payTo) {
      setFormData(prev => ({ ...prev, payTo: address }));
    }
  }, [address, formData.payTo]);

  const {
    mutate: fetchAndRegister,
    isPending: isFetchingMetadata,
  } = api.resources.register.useMutation({
    onSuccess: data => {
      // Extract URL components
      const url = new URL(data.resource.resource);
      const scheme = url.protocol.replace(':', '');

      // Pre-fill form with fetched metadata
      setFormData(prev => ({
        ...prev,
        scheme,
        resource: data.resource.resource,
        description: data.accepts.description ?? '',
        mimeType: data.accepts.mimeType ?? 'application/json',
        outputSchema: data.accepts.outputSchema
          ? JSON.stringify(data.accepts.outputSchema)
          : '',
        maxAmountRequired: data.accepts.maxAmountRequired.replace(/[^0-9]/g, ''), // Remove formatting
        network: data.accepts.network.replace('_', '-'),
        extra: data.accepts.extra
          ? typeof data.accepts.extra === 'string'
            ? data.accepts.extra
            : JSON.stringify(data.accepts.extra)
          : '',
      }));
      toast.success('Metadata fetched and resource registered');
    },
    onError: () => {
      toast.error('Failed to fetch metadata from URL');
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addResource } = useAddResource();
  const [isPending, setIsPending] = useState(false);

  const validateForm = () => {
    try {
      resourceFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach(err => {
          if (err.path[0]) {
            newErrors[String(err.path[0])] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }

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
        payTo: address ?? ('' as Address),
        maxTimeoutSeconds: 0,
        asset: '' as Address,
        extra: '',
      });
      setErrors({});
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
    // Clear error for this field when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  };

  const isFormValid =
    formData.scheme &&
    formData.network &&
    formData.maxAmountRequired &&
    formData.resource &&
    formData.description &&
    formData.mimeType &&
    formData.outputSchema &&
    formData.payTo &&
    formData.maxTimeoutSeconds > 0 &&
    formData.asset &&
    Object.keys(errors).length === 0;

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
          <div className="flex flex-col gap-1">
            <Label>Fetch from Resource URL</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="https://example.com/api/resource"
                value={resourceUrl}
                onChange={e => setResourceUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isFetchingMetadata || !resourceUrl}
                onClick={() => fetchAndRegister({ url: resourceUrl, headers: {} })}
              >
                {isFetchingMetadata ? 'Fetching...' : 'Fetch'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Fetch metadata from an x402 resource to pre-fill the form
            </p>
          </div>

          <div className="border-b" />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Scheme *</Label>
              <Input
                type="text"
                placeholder="http"
                value={formData.scheme}
                onChange={e => updateField('scheme', e.target.value)}
              />
              {errors.scheme && (
                <p className="text-xs text-destructive">{errors.scheme}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Network *</Label>
              <Input
                type="text"
                placeholder="mainnet"
                value={formData.network}
                onChange={e => updateField('network', e.target.value)}
              />
              {errors.network && (
                <p className="text-xs text-destructive">{errors.network}</p>
              )}
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
            {errors.resource && (
              <p className="text-xs text-destructive">{errors.resource}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label>Description *</Label>
            <textarea
              placeholder="Resource description"
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              rows={3}
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none resize-y disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
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
              {errors.maxAmountRequired && (
                <p className="text-xs text-destructive">
                  {errors.maxAmountRequired}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Max Timeout (seconds) *</Label>
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
              {errors.maxTimeoutSeconds && (
                <p className="text-xs text-destructive">
                  {errors.maxTimeoutSeconds}
                </p>
              )}
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
            {errors.payTo && (
              <p className="text-xs text-destructive">{errors.payTo}</p>
            )}
            {address && formData.payTo === address && (
              <p className="text-xs text-muted-foreground">
                Using your connected wallet address
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label>Asset Address *</Label>
            <Input
              type="text"
              placeholder="0x..."
              value={formData.asset}
              onChange={e => updateField('asset', e.target.value as Address)}
            />
            {errors.asset && (
              <p className="text-xs text-destructive">{errors.asset}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label>MIME Type *</Label>
            <Input
              type="text"
              placeholder="application/json"
              value={formData.mimeType}
              onChange={e => updateField('mimeType', e.target.value)}
            />
            {errors.mimeType && (
              <p className="text-xs text-destructive">{errors.mimeType}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Label>Output Schema *</Label>
            <textarea
              placeholder='{"input": {...}, "output": {...}}'
              value={formData.outputSchema}
              onChange={e => updateField('outputSchema', e.target.value)}
              rows={6}
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none resize-y disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive font-mono"
            />
            {errors.outputSchema && (
              <p className="text-xs text-destructive">
                {errors.outputSchema}
              </p>
            )}
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
