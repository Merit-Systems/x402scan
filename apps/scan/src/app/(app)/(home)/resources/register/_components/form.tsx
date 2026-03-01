'use client';

import { useMemo, useState } from 'react';

import {
  ArrowDown,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plus,
  Server,
  Trash2,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { DiscoveryPanel, useDiscovery } from '@/app/(app)/_components/discovery';
import { Favicon } from '@/app/(app)/_components/favicon';
import { cn } from '@/lib/utils';
import { normalizeUrl } from '@/lib/url';
import { api } from '@/trpc/client';
import Link from 'next/link';
import { z } from 'zod';

interface ManualRegistrationResult {
  success: true;
  registered: number;
  total: number;
  failed: number;
  failedDetails: { url: string; error: string; status?: number }[];
  originId?: string;
  origin: string | null;
}

function getErrorMessageFromRegisterResult(result: {
  success: false;
  error: {
    type: 'parseErrors' | 'no402';
    parseErrors?: string[];
  };
}): string {
  if (result.error.type === 'parseErrors') {
    const parseErrors = result.error.parseErrors ?? [];
    if (parseErrors.length > 0) {
      return `parseResponse: ${parseErrors.join(', ')}`;
    }
    return 'parseResponse: Invalid x402 response';
  }

  return 'Expected 402 response';
}

const registerSuccessResultSchema = z.object({
  resource: z.object({
    origin: z.object({
      id: z.string(),
    }),
  }),
});

function safeGetOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function toPathLabel(resourceUrl: string): string {
  try {
    const parsed = new URL(resourceUrl);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return resourceUrl;
  }
}

export const RegisterResourceForm = () => {
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<{ name: string; value: string }[]>([]);
  const [manualUrls, setManualUrls] = useState<string[]>([]);
  const [manualListError, setManualListError] = useState<string | null>(null);
  const [manualProgress, setManualProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isRegisteringManual, setIsRegisteringManual] = useState(false);
  const [manualResult, setManualResult] =
    useState<ManualRegistrationResult | null>(null);

  const utils = api.useUtils();

  const {
    isValidUrl,
    urlOrigin,
    isOriginOnly,
    isDiscoveryLoading,
    discoveryFound,
    discoverySource,
    discoveryError,
    actualDiscoveredResources,
    isRegisteringAll,
    bulkData,
    bulkError,
    handleRegisterAll,
    resetBulk,
    preview,
    isBatchTestLoading,
    testedResources,
    failedResources,
  } = useDiscovery({
    url,
  });

  const registerMutation = api.public.resources.register.useMutation();

  const normalizedUrl = useMemo(() => normalizeUrl(url.trim()), [url]);

  const queueOrigin = useMemo(
    () => (manualUrls.length > 0 ? safeGetOrigin(manualUrls[0] ?? '') : null),
    [manualUrls]
  );

  const hasDiscoveryResources =
    discoveryFound && actualDiscoveredResources.length > 0;

  const canUseManualMode = isValidUrl && !isOriginOnly;
  const currentUrlAlreadyInManualList = manualUrls.includes(normalizedUrl);
  const canAddCurrentUrl =
    canUseManualMode &&
    !currentUrlAlreadyInManualList &&
    (!queueOrigin || queueOrigin === urlOrigin);

  const manualTargets =
    manualUrls.length > 0
      ? manualUrls
      : canUseManualMode
        ? [normalizedUrl]
        : [];

  const testedResourceByUrl = useMemo(() => {
    const map = new Map<string, (typeof testedResources)[number]>();
    for (const tested of testedResources) {
      map.set(normalizeUrl(tested.url), tested);
    }
    return map;
  }, [testedResources]);

  const failedResourceByUrl = useMemo(() => {
    const map = new Map<string, (typeof failedResources)[number]>();
    for (const failed of failedResources) {
      map.set(normalizeUrl(failed.url), failed);
    }
    return map;
  }, [failedResources]);

  const currentManualTested = testedResourceByUrl.get(normalizedUrl);
  const currentManualFailed = failedResourceByUrl.get(normalizedUrl);

  const activeBulkResult = manualResult ?? bulkData ?? null;
  const activeSummaryOrigin = manualResult?.origin ?? urlOrigin;
  const shouldShowReset =
    activeBulkResult !== null || manualUrls.length > 0 || url.length > 0;

  const requestHeaders = useMemo(() => {
    const entries = headers
      .map(header => ({
        name: header.name.trim(),
        value: header.value,
      }))
      .filter(header => header.name.length > 0);

    if (entries.length === 0) {
      return undefined;
    }

    return Object.fromEntries(entries.map(header => [header.name, header.value]));
  }, [headers]);

  const resetStateForNewRun = () => {
    setManualResult(null);
    setManualProgress(null);
    setManualListError(null);
    resetBulk();
  };

  const handleUrlChange = (nextUrl: string) => {
    setUrl(nextUrl);
    setManualResult(null);
    setManualProgress(null);
    setManualListError(null);
  };

  const handleAddCurrentUrl = () => {
    if (!canUseManualMode) {
      return;
    }

    if (queueOrigin && queueOrigin !== urlOrigin) {
      setManualListError('All manual URLs must share the same origin.');
      return;
    }

    if (!currentUrlAlreadyInManualList) {
      setManualUrls(current => [...current, normalizedUrl]);
    }

    setManualListError(null);
    setManualResult(null);
    setManualProgress(null);
  };

  const handleRemoveManualUrl = (targetUrl: string) => {
    setManualUrls(current => current.filter(item => item !== targetUrl));
    setManualResult(null);
    setManualProgress(null);
    setManualListError(null);
  };

  const handleResetAll = () => {
    setUrl('');
    setHeaders([]);
    setManualUrls([]);
    setManualListError(null);
    setManualProgress(null);
    setManualResult(null);
    setIsRegisteringManual(false);
    registerMutation.reset();
    resetBulk();
  };

  const handleRegisterDiscovered = () => {
    setManualResult(null);
    setManualProgress(null);
    setManualListError(null);
    handleRegisterAll();
  };

  const handleRegisterManual = async () => {
    if (manualTargets.length === 0 || isRegisteringManual) {
      return;
    }

    resetStateForNewRun();
    setIsRegisteringManual(true);

    let registered = 0;
    let originId: string | undefined;
    const failedDetails: { url: string; error: string; status?: number }[] = [];

    for (let index = 0; index < manualTargets.length; index += 1) {
      const targetUrl = manualTargets[index] ?? '';
      setManualProgress({ current: index + 1, total: manualTargets.length });

      try {
        const result = await registerMutation.mutateAsync({
          url: targetUrl,
          headers: requestHeaders,
        });

        if (result.success) {
          registered += 1;
          const parsedSuccessResult = registerSuccessResultSchema.safeParse(result);
          if (parsedSuccessResult.success) {
            originId ??= parsedSuccessResult.data.resource.origin.id;
          }
          continue;
        }

        failedDetails.push({
          url: targetUrl,
          error: getErrorMessageFromRegisterResult(result),
        });
      } catch (error) {
        failedDetails.push({
          url: targetUrl,
          error: error instanceof Error ? error.message : 'Request failed',
        });
      }
    }

    if (registered > 0) {
      void utils.public.resources.list.invalidate();
      void utils.public.origins.list.withResources.invalidate();
      void utils.public.sellers.bazaar.list.invalidate();
    }

    setManualResult({
      success: true,
      registered,
      total: manualTargets.length,
      failed: failedDetails.length,
      failedDetails,
      originId,
      origin: safeGetOrigin(manualTargets[0] ?? ''),
    });

    setIsRegisteringManual(false);
  };

  const renderProbeCard = () => {
    if (url.trim().length === 0) {
      return null;
    }

    if (!isValidUrl) {
      return (
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <XCircle className="size-6 text-red-600 shrink-0" />
            <div>
              <CardTitle className="text-base">Invalid URL</CardTitle>
              <CardDescription>
                Enter a full URL like <code>https://api.example.com</code>.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      );
    }

    if (isDiscoveryLoading) {
      return (
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Loader2 className="size-6 animate-spin text-muted-foreground shrink-0" />
            <div>
              <CardTitle className="text-base">Fetching Server Info</CardTitle>
              <CardDescription>Checking discovery and endpoint data...</CardDescription>
            </div>
          </CardHeader>
        </Card>
      );
    }

    if (hasDiscoveryResources) {
      const previewResources = actualDiscoveredResources.slice(0, 8);
      const hiddenCount = actualDiscoveredResources.length - previewResources.length;

      return (
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <Favicon
              url={preview?.favicon ?? null}
              className="size-10 rounded-md border bg-background shrink-0"
            />
            <div className="min-w-0">
              <CardTitle className="text-base truncate">
                {preview?.title ?? urlOrigin ?? 'Discovered Server'}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {preview?.description ??
                  `Found ${actualDiscoveredResources.length} resource${actualDiscoveredResources.length === 1 ? '' : 's'} via ${discoverySource === 'dns' ? 'DNS/.well-known' : '.well-known/x402'}.`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="border-t pt-4">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {previewResources.map(resource => (
                <li key={resource} className="font-mono truncate">
                  {toPathLabel(resource)}
                </li>
              ))}
              {hiddenCount > 0 && (
                <li className="text-muted-foreground/70">+ {hiddenCount} more</li>
              )}
            </ul>
          </CardContent>
        </Card>
      );
    }

    if (isOriginOnly) {
      return (
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <XCircle className="size-6 text-red-600 shrink-0" />
            <div>
              <CardTitle className="text-base">No Discovery Document Found</CardTitle>
              <CardDescription>
                {discoveryError ??
                  'This origin has no discoverable resource list yet. Enter a full endpoint URL to register manually.'}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <Server className="size-6 text-muted-foreground shrink-0" />
          <div>
            <CardTitle className="text-base">Manual URL Mode</CardTitle>
            <CardDescription>
              No discovery resources found for this origin. You can still register URLs directly.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="border-t pt-4 text-xs text-muted-foreground space-y-1">
          {isBatchTestLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="size-3 animate-spin" />
              Testing endpoint response...
            </div>
          ) : currentManualTested ? (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="size-3" />
              Endpoint responds with a valid 402 challenge.
            </div>
          ) : currentManualFailed ? (
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="size-3" />
              {currentManualFailed.error}
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Server</CardTitle>
          <CardDescription>
            Enter a server URL. If discovery is available, we&apos;ll register everything.
            If not, you can add endpoint URLs manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Server or Endpoint URL</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="https://api.example.com"
                value={url}
                onChange={event => handleUrlChange(event.target.value)}
              />
              {!hasDiscoveryResources && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCurrentUrl}
                  disabled={!canAddCurrentUrl || isRegisteringManual}
                  className="shrink-0"
                >
                  <Plus className="size-4 mr-1" />
                  Add URL
                </Button>
              )}
            </div>
            {manualListError && (
              <p className="text-xs text-red-600">{manualListError}</p>
            )}
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="size-fit p-0 text-xs text-muted-foreground/70 hover:text-muted-foreground"
              >
                Advanced Configuration
                <ChevronDown className="size-3 ml-1" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="border p-4 rounded-md mt-2">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Headers</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setHeaders(current => [...current, { name: '', value: '' }])}
                    className="size-fit px-1"
                  >
                    <Plus className="size-3 mr-1" />
                    Add Header
                  </Button>
                </div>
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-1 items-center">
                    <Input
                      type="text"
                      placeholder="Name"
                      value={header.name}
                      onChange={event =>
                        setHeaders(current =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, name: event.target.value } : item
                          )
                        )
                      }
                    />
                    <Input
                      type="text"
                      placeholder="Value"
                      value={header.value}
                      onChange={event =>
                        setHeaders(current =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, value: event.target.value } : item
                          )
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setHeaders(current => current.filter((_, itemIndex) => itemIndex !== index))
                      }
                      className="shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {manualUrls.length > 0 && !hasDiscoveryResources && (
            <div className="border rounded-md p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Manual URLs ({manualUrls.length})
              </p>
              <ul className="space-y-1">
                {manualUrls.map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs">
                    <code className="font-mono break-all flex-1">{item}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveManualUrl(item)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2">
          {hasDiscoveryResources ? (
            <Button
              variant="turbo"
              disabled={isRegisteringAll}
              onClick={handleRegisterDiscovered}
            >
              {isRegisteringAll ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Registering resources...
                </>
              ) : (
                `Add Server (${actualDiscoveredResources.length} resources)`
              )}
            </Button>
          ) : (
            <Button
              variant="turbo"
              disabled={manualTargets.length === 0 || isRegisteringManual}
              onClick={() => {
                void handleRegisterManual();
              }}
            >
              {isRegisteringManual ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  {manualProgress
                    ? `Checking ${manualProgress.current}/${manualProgress.total} resources`
                    : 'Registering...'}
                </>
              ) : manualTargets.length > 1 ? (
                `Register ${manualTargets.length} URLs`
              ) : (
                'Register URL'
              )}
            </Button>
          )}

          {shouldShowReset && (
            <Button variant="outline" onClick={handleResetAll}>
              Reset
            </Button>
          )}
        </CardFooter>
      </Card>

      {renderProbeCard() ? (
        <div className="flex flex-col items-center gap-4">
          <ArrowDown className="size-5 text-muted-foreground" />
          <div className="w-full">{renderProbeCard()}</div>
        </div>
      ) : null}

      {activeBulkResult && activeSummaryOrigin ? (
        <DiscoveryPanel
          origin={activeSummaryOrigin}
          isLoading={false}
          found={hasDiscoveryResources}
          source={discoverySource}
          resources={[]}
          resourceCount={0}
          isRegisteringAll={false}
          bulkResult={activeBulkResult}
        />
      ) : null}

      {activeBulkResult?.originId ? (
        <div className="flex gap-2">
          <Link href={`/server/${activeBulkResult.originId}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Server
            </Button>
          </Link>
        </div>
      ) : null}

      {bulkError && (
        <p className={cn('text-sm text-red-600')}>{bulkError}</p>
      )}

      {registerMutation.error && (
        <p className={cn('text-sm text-red-600')}>
          {registerMutation.error.message}
        </p>
      )}
    </div>
  );
};
