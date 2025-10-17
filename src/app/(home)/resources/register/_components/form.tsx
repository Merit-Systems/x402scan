'use client';

import { useState } from 'react';

import { AlertTriangle, ChevronDown, Eye, Plus, X } from 'lucide-react';

import z from 'zod';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

import { api } from '@/trpc/client';

import { Favicon } from '@/app/_components/favicon';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const RegisterResourceForm = () => {
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
      if (data.error) {
        toast.error('Failed to add resource');
        return;
      }
      void utils.resources.list.invalidate();
      void utils.origins.list.withResources.invalidate();
      void utils.resources.getResourceByAddress.invalidate(data.accepts.payTo);
      void utils.origins.list.withResources.byAddress.invalidate(
        data.accepts.payTo
      );
      void utils.sellers.list.bazaar.invalidate();
      if (data.enhancedParseWarnings) {
        toast.warning(
          'Resource added successfully, but is not available for use'
        );
      } else {
        toast.success('Resource added successfully');
      }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data ? 'Resource Added' : 'Add Resource'}</CardTitle>
        <CardDescription>
          {data
            ? 'This resource is now registered on and available throughout x402scan.'
            : "Know of an x402 resource that isn't listed? Add it here."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data && !data.error ? (
          <div className="flex flex-col gap-4 overflow-hidden w-full max-w-full">
            <div className="flex flex-col gap-2 bg-muted p-4 rounded-md">
              <div className="flex gap-4 justify-between overflow-hidden w-full max-w-full bg-muted rounded-md">
                <div className="flex items-center gap-2 flex-1 overflow-hidden max-w-full">
                  <Favicon
                    url={data.resource.origin.favicon}
                    className="size-4 rounded-md"
                  />
                  <h1 className="font-bold flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    {data.resource.origin.title ??
                      new URL(data.resource.origin.origin).hostname}
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

            {data.enhancedParseWarnings && (
              <div className="flex flex-col gap-1 bg-yellow-600/10 rounded-md border-yellow-600/60 border">
                <div className="border-b p-4 border-b-yellow-600/60 flex items-center justify-between gap-2">
                  <div className="flex flex-row gap-2 items-center">
                    <AlertTriangle className="size-6 text-yellow-600" />
                    <div>
                      <h2 className="font-semibold">
                        Added with Parse Warnings
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        The resource was added successfully, but is not
                        available for use because the output schema is not
                        properly typed.
                      </p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost">
                        <Eye className="size-4" />
                        See Response
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invalid x402 Response</DialogTitle>
                        <DialogDescription>
                          The route responded with a 402, but the response body
                          was not properly typed.
                        </DialogDescription>
                      </DialogHeader>
                      <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded-md max-h-48 overflow-auto">
                        {JSON.stringify(data.response, null, 2)}
                      </pre>
                    </DialogContent>
                  </Dialog>
                </div>
                <ul className="list-disc list-inside text-sm text-muted-foreground p-4">
                  {data.enhancedParseWarnings.map(warning => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
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
            {data !== undefined && data.success === false && (
              <div>
                <div className="flex flex-col gap-1 bg-red-600/10 rounded-md border-red-600/60 border">
                  <div
                    className={cn(
                      'flex justify-between items-center gap-2 p-4',
                      data.error.type === 'parseErrors' &&
                        'border-b border-b-red-600/60'
                    )}
                  >
                    <div className={cn('flex items-center gap-2')}>
                      <AlertTriangle className="size-6 text-red-600" />
                      <div>
                        <h2 className="font-semibold">
                          {data.error.type === 'parseErrors'
                            ? 'Invalid x402 Response'
                            : 'No 402 Response'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {data.error.type === 'parseErrors'
                            ? 'The route responded with a 402, but the response body was not properly typed.'
                            : 'The route did not respond with a 402.'}
                        </p>
                      </div>
                    </div>
                    {data.error.type === 'parseErrors' && (
                      <Dialog>
                        <DialogTrigger>
                          <Button variant="ghost">
                            <Eye className="size-4" />
                            See Response
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Invalid x402 Response</DialogTitle>
                            <DialogDescription>
                              The route responded with a 402, but the response
                              body was not properly typed.
                            </DialogDescription>
                          </DialogHeader>
                          <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded-md max-h-48 overflow-auto">
                            {JSON.stringify(data.data, null, 2)}
                          </pre>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {data.error.type === 'parseErrors' && (
                    <ul className="list-disc list-inside text-sm text-muted-foreground p-4">
                      {data.error.parseErrors.map(warning => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {data && !data.error ? (
          <>
            <Link href="/resources" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
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
      </CardFooter>
    </Card>
  );
};
