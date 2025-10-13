'use client';

import { useState } from 'react';

import { ChevronDown, Plus, X } from 'lucide-react';

import { toast } from 'sonner';

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

import { api } from '@/trpc/client';
import z from 'zod';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Favicon } from '@/components/favicon';
import { useSearchParams } from 'next/navigation';

interface Props {
  children?: React.ReactNode;
}

export const AddResourcesDialog = ({ children }: Props) => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(
    searchParams.get('add_resources') === 'true'
  );
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<
    {
      name: string;
      value: string;
    }[]
  >([]);

  const utils = api.useUtils();

  const {
    mutate: addResource,
    isPending,
    data,
    reset,
  } = api.resources.register.useMutation({
    onSuccess: data => {
      void utils.resources.list.invalidate();
      void utils.origins.list.withResources.invalidate();
      void utils.resources.getResourceByAddress.invalidate(data.accepts.payTo);
      void utils.origins.list.withResources.byAddress.invalidate(
        data.accepts.payTo
      );
      void utils.sellers.list.bazaar.invalidate();
      toast.success('Resource added successfully');
    },
    onError: () => {
      toast.error('Failed to add resource');
    },
  });

  const onReset = () => {
    setUrl('');
    setHeaders([]);
    reset();
  };

  const onClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onReset();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="outline">
            <Plus className="size-4" />
            Add Resources
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="p-0 overflow-hidden gap-0">
        <DialogHeader className="bg-muted border-b p-4">
          <DialogTitle>{data ? 'Resource Added' : 'Add Resource'}</DialogTitle>
          <DialogDescription>
            {data
              ? 'This resource is now registered on and available throughout x402scan.'
              : "Know of an x402 resource that isn't listed? Add it here."}
          </DialogDescription>
        </DialogHeader>
        {data ? (
          <div className="p-4 flex flex-col gap-1 overflow-hidden w-full max-w-full">
            <div className="flex gap-4 justify-between overflow-hidden w-full max-w-full">
              <div className="flex items-center gap-2 flex-1 overflow-hidden max-w-full">
                <Favicon
                  url={data.origin.favicon}
                  className="size-4 rounded-md"
                />
                <h1 className="text-lg font-bold flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                  {data.resource.resource}
                </h1>
              </div>
              <p className="text-lg text-primary font-bold">
                {data.accepts.maxAmountRequired}
              </p>
            </div>
            {data.accepts.description && (
              <p className="text-sm text-muted-foreground">
                {data.accepts.description}
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label>Resource URL</Label>
              <Input
                type="text"
                placeholder="https://"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="size-fit p-0 w-full md:size-fit text-xs md:text-xs text-muted-foreground/60 hover:text-muted-foreground"
                >
                  Advanced Configuration
                  <ChevronDown className="size-3" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="border p-4 rounded-md">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Headers</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() =>
                        setHeaders([...headers, { name: '', value: '' }])
                      }
                      className="size-fit px-1 md:size-fit"
                    >
                      <Plus className="size-3" />
                      Add Header
                    </Button>
                  </div>
                  {headers.map((header, index) => (
                    <div key={index} className="flex gap-1 items-center">
                      <Input
                        type="text"
                        placeholder="Name"
                        value={header.name}
                        onChange={e =>
                          setHeaders(
                            headers.map((h, i) =>
                              i === index ? { ...h, name: e.target.value } : h
                            )
                          )
                        }
                      />
                      <Input
                        type="text"
                        placeholder="Value"
                        value={header.value}
                        onChange={e =>
                          setHeaders(
                            headers.map((h, i) =>
                              i === index ? { ...h, value: e.target.value } : h
                            )
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setHeaders(headers.filter((_, i) => i !== index))
                        }
                        className="shrink-0 size-fit p-0 w-full md:size-fit text-xs md:text-xs text-muted-foreground/60 hover:text-muted-foreground"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        <DialogFooter className="bg-muted border-t p-4">
          {data ? (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              <Button variant="turbo" onClick={onReset} className="flex-1">
                Add Another
              </Button>
            </>
          ) : (
            <Button
              variant="turbo"
              disabled={isPending || !z.url().safeParse(url).success}
              onClick={() =>
                addResource({
                  url,
                  headers: Object.fromEntries(
                    headers.map(h => [h.name, h.value])
                  ),
                })
              }
              className="w-full"
            >
              {isPending ? 'Adding...' : 'Add'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
