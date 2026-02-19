'use client';

import { useState } from 'react';

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Eye,
  Info,
  Loader2,
  Plus,
  X,
} from 'lucide-react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { api } from '@/trpc/client';

import {
  DiscoveryPanel,
  useDiscovery,
} from '@/app/(app)/_components/discovery';
import { Favicon } from '@/app/(app)/_components/favicon';
import { parseChain } from '@/app/(app)/_lib/chain/parse';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { AcceptsBreakdownTable } from './accepts-breakdown-table';
import { RegistrationAlert } from './registration-alert';
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

  // Use shared discovery hook
  const {
    isValidUrl,
    urlOrigin,
    isOriginOnly,
    enteredUrlInDiscovery,
    isDiscoveryLoading,
    discoveryFound,
    discoverySource,
    discoveryError,
    actualDiscoveredResources,
    invalidResourcesMap,
    registeredUrls,
    isRegisteringAll,
    bulkData,
    handleRegisterAll,
    resetBulk,
    ownershipVerified,
    ownershipProofs,
    payToAddresses,
    recoveredAddresses,
    verifiedAddresses,
    preview,
    isPreviewLoading,
    refreshDiscovery,
  } = useDiscovery({
    url,
    onRegisterAllSuccess: data => {
      const deprecatedMsg =
        'deprecated' in data && data.deprecated && data.deprecated > 0
          ? `, ${data.deprecated} deprecated`
          : '';
      toast.success(
        `Registered ${data.registered} of ${data.total} resources${deprecatedMsg}`
      );
    },
    onRegisterAllError: () => {
      toast.error('Failed to register resources');
    },
  });

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
          chain: parseChain(accept.network),
        });
      }
      void utils.public.sellers.bazaar.list.invalidate();
      toast.success('Resource added successfully', {
        action: {
          label: 'View Server',
          onClick: () => {
            window.location.href = `/server/${data.resource.origin.id}`;
          },
        },
      });
    },
    onError: () => {
      toast.error('Failed to add resource');
    },
  });

  const onReset = () => {
    setUrl('');
    setHeaders([]);
    reset();
    resetBulk();
  };

  // Handle registering a single resource
  const handleRegisterSingle = () => {
    if (!isValidUrl) return;
    addResource({
      url,
      headers: Object.fromEntries(headers.map(h => [h.name, h.value])),
    });
  };

  // Sanitize possibly loosely-typed values from discovery for strict props
  const safeOwnershipVerified = Boolean(ownershipVerified);
  const safeOwnershipProofs: string[] = Array.isArray(ownershipProofs)
    ? ownershipProofs.filter((s): s is string => typeof s === 'string')
    : [];
  const safeRecoveredAddresses: string[] = Array.isArray(recoveredAddresses)
    ? recoveredAddresses.filter((s): s is string => typeof s === 'string')
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          {data ? 'Resource Added' : 'Add Resource'}
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          {data
            ? 'This resource is now registered on and available throughout x402scan.'
            : "Know of an x402 resource that isn't listed? Add it here."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data && !data.error ? (
          <div className="flex flex-col gap-2 overflow-hidden w-full max-w-full">
            <div className="border rounded-lg p-4 bg-linear-to-br from-muted/30 to-muted/10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Favicon
                  url={data.resource.origin.favicon}
                  className="size-10 rounded-lg border bg-background shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col">
                  <h2 className="font-bold text-lg truncate">
                    {data.resource.resource.resource}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {data.resource.accepts.find(accept => accept.description)
                      ?.description ?? 'No description'}
                  </p>
                </div>
              </div>
              <Link href={`/server/${data.resource.origin.id}`}>
                <Button variant="outline" size="sm" className="w-full md:w-fit">
                  View Server Page <ChevronRight className="size-4" />
                </Button>
              </Link>
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
                  data.registrationDetails?.supportedAccepts.length === 0 ||
                  // No metadata scraped
                  (!data.registrationDetails?.originMetadata?.title &&
                    !data.registrationDetails?.originMetadata?.description);

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
                    hasOriginMetadata={Boolean(
                      data.registrationDetails?.originMetadata?.title ??
                      data.registrationDetails?.originMetadata?.description
                    )}
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
                            (accept: {
                              network: string;
                              payTo: string;
                              asset: string;
                            }) => ({
                              network: accept.network,
                              payTo: accept.payTo,
                              asset: accept.asset,
                              isSupported: true,
                            })
                          ),
                          ...data.registrationDetails.unsupportedAccepts.map(
                            (accept: {
                              network: string;
                              payTo: string;
                              asset: string;
                            }) => ({
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
            {/* Discovery Tip */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 border rounded-md">
              <Info className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">Tip: Enable automatic discovery</p>
                <p className="text-muted-foreground mt-1">
                  Implement a discovery document at{' '}
                  <code className="px-1 py-0.5 bg-muted rounded text-xs">
                    /.well-known/x402
                  </code>{' '}
                  to register all your resources at once.{' '}
                  <a
                    href="https://github.com/Merit-Systems/x402scan/blob/main/docs/DISCOVERY.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline font-medium"
                  >
                    Learn more
                  </a>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Label>Resource URL</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="https://"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="pr-10"
                />
                {isDiscoveryLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
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

            {/* Discovery Results */}
            <DiscoveryPanel
              origin={urlOrigin}
              enteredUrl={
                !isOriginOnly && !enteredUrlInDiscovery ? url : undefined
              }
              isLoading={isDiscoveryLoading}
              found={discoveryFound}
              source={discoverySource}
              resources={actualDiscoveredResources}
              resourceCount={actualDiscoveredResources.length}
              discoveryError={discoveryError}
              invalidResourcesMap={invalidResourcesMap}
              isRegisteringAll={isRegisteringAll}
              bulkResult={bulkData}
              onRegisterAll={handleRegisterAll}
              onRefresh={refreshDiscovery}
              showRegisterButton={false}
              registeredUrls={registeredUrls}
              ownershipVerified={safeOwnershipVerified}
              ownershipProofs={safeOwnershipProofs}
              payToAddresses={payToAddresses}
              recoveredAddresses={safeRecoveredAddresses}
              verifiedAddresses={verifiedAddresses}
              preview={preview}
              isPreviewLoading={isPreviewLoading}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {data && !data.error ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onReset} className="flex-1">
              Add Another
            </Button>
            <Link
              href={`/server/${data.resource.origin.id}`}
              className="flex-1"
            >
              <Button variant="turbo" className="w-full">
                View Server
              </Button>
            </Link>
          </div>
        ) : bulkData?.success && bulkData.registered > 0 ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onReset} className="flex-1">
              Add Another
            </Button>
            {bulkData.originId && (
              <Link href={`/server/${bulkData.originId}`} className="flex-1">
                <Button variant="turbo" className="w-full">
                  View Server
                </Button>
              </Link>
            )}
          </div>
        ) : bulkData?.success && bulkData.registered === 0 ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={resetBulk} className="flex-1">
              Try Again
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="turbo" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        ) : discoveryFound ? (
          <div className="flex flex-col gap-2 w-full">
            <Button
              variant="turbo"
              disabled={isRegisteringAll}
              onClick={handleRegisterAll}
              className="w-full"
            >
              {isRegisteringAll ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                `Register All ${actualDiscoveredResources.length} Resources`
              )}
            </Button>
            {!isOriginOnly && (
              <Button
                variant="outline"
                disabled={isPending}
                onClick={handleRegisterSingle}
                className="w-full"
              >
                {isPending ? 'Adding...' : 'Register Only This URL'}
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="turbo"
            disabled={isPending || !isValidUrl}
            onClick={handleRegisterSingle}
            className="w-full"
          >
            {isPending ? 'Adding...' : 'Add'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
