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
import { getChain } from '@/app/_lib/chain';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { RegistrationAlert } from './registration-alert';
import { AcceptsBreakdownTable } from './accepts-breakdown-table';
import { RegistrationChecklist } from './registration-checklist';

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
  } = api.public.resources.register.useMutation({
    onSuccess: data => {
      if (data.error) {
        toast.error('Failed to add resource');
        return;
      }
      void utils.public.resources.list.invalidate();
      void utils.public.origins.list.withResources.invalidate();
      for (const accept of data.accepts) {
        void utils.public.resources.getResourceByAddress.invalidate(
          accept.payTo
        );
        void utils.public.origins.list.withResources.invalidate({
          address: accept.payTo,
          chain: getChain(accept.network),
        });
      }
      void utils.public.sellers.bazaar.list.invalidate();
      if (data.enhancedParseWarnings) {
        toast.warning(
          'Resource added successfully, but is not available for use',
          {
            action: {
              label: 'View Server',
              onClick: () => {
                window.location.href = `/server/${data.resource.origin.id}`;
              },
            },
          }
        );
      } else {
        toast.success('Resource added successfully', {
          action: {
            label: 'View Server',
            onClick: () => {
              window.location.href = `/server/${data.resource.origin.id}`;
            },
          },
        });
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
          <div className="flex flex-col gap-6 overflow-hidden w-full max-w-full">
            {/* Origin Header Card */}
            <div className="border rounded-lg p-4 bg-gradient-to-br from-muted/30 to-muted/10">
              <div className="flex items-start gap-3">
                <Favicon
                  url={data.resource.origin.favicon}
                  className="size-10 rounded-lg border bg-background shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-lg mb-1 truncate">
                    {data.resource.origin.title ??
                      new URL(data.resource.origin.origin).hostname}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    Resource successfully registered on x402scan
                  </p>
                  <Link href={`/server/${data.resource.origin.id}`}>
                    <Button variant="outline" size="sm">
                      View Server Page →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Registration status alert */}
            {data.registrationDetails && (
              <RegistrationAlert
                registeredCount={
                  data.registrationDetails.supportedAccepts.length
                }
                filteredCount={
                  data.registrationDetails.unsupportedAccepts.length
                }
                totalCount={data.registrationDetails.providedAccepts.length}
              />
            )}

            {/* Detailed breakdown in accordion */}
            <Accordion
              type="multiple"
              defaultValue={(() => {
                const hasErrors =
                  // No accepts registered
                  (data.registrationDetails?.supportedAccepts.length === 0) ||
                  // Enhanced schema failed
                  !!data.enhancedParseWarnings ||
                  // No metadata scraped
                  !data.registrationDetails?.originMetadata?.title &&
                  !data.registrationDetails?.originMetadata?.description;

                const hasFilteredAccepts =
                  data.registrationDetails &&
                  data.registrationDetails.unsupportedAccepts.length > 0;

                if (hasErrors && hasFilteredAccepts) {
                  return ['accepts', 'checklist'];
                } else if (hasErrors) {
                  return ['checklist'];
                } else if (hasFilteredAccepts) {
                  return ['accepts'];
                }
                return [];
              })()}
              className="w-full"
            >
              {/* Registration checklist */}
              <AccordionItem value="checklist" className="border-b">
                <AccordionTrigger className="py-3">
                  <span className="font-semibold">Registration Details</span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  <RegistrationChecklist
                    methodUsed={data.methodUsed}
                    hasAccepts={
                      data.registrationDetails
                        ? data.registrationDetails.supportedAccepts.length > 0
                        : false
                    }
                    hasEnhancedSchema={!data.enhancedParseWarnings}
                    hasOriginMetadata={
                      Boolean(
                        data.registrationDetails?.originMetadata?.title ??
                          data.registrationDetails?.originMetadata?.description
                      )
                    }
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Accepts breakdown section */}
              {data.registrationDetails &&
                data.registrationDetails.providedAccepts.length > 0 && (
                  <AccordionItem value="accepts" className="border-b">
                    <AccordionTrigger className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Payment Addresses</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {data.registrationDetails.providedAccepts.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-2">
                      <AcceptsBreakdownTable
                        accepts={[
                          ...data.registrationDetails.supportedAccepts.map(
                            (
                              accept: {
                                network: string;
                                payTo: string;
                                asset: string;
                              }
                            ) => ({
                              network: accept.network,
                              payTo: accept.payTo,
                              asset: accept.asset,
                              isSupported: true,
                            })
                          ),
                          ...data.registrationDetails.unsupportedAccepts.map(
                            (
                              accept: {
                                network: string;
                                payTo: string;
                                asset: string;
                              }
                            ) => ({
                              network: accept.network,
                              payTo: accept.payTo,
                              asset: accept.asset,
                              isSupported: false,
                            })
                          ),
                        ]}
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}

              {/* Raw response viewer */}
              <AccordionItem value="response" className="border-b">
                <AccordionTrigger className="py-3">
                  <span className="font-semibold">Raw 402 Response</span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  <pre className="text-xs font-mono whitespace-pre-wrap bg-muted p-4 rounded-md max-h-96 overflow-auto">
                    {JSON.stringify(data.response, null, 2)}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
            {data?.success === false && (
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
