'use client';

import { useMemo, useState } from 'react';

import {
  Check,
  ChevronDown,
  Loader2,
  Minus,
  CircleHelp,
  TriangleAlert,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  DiscoveryFixHint,
  DiscoveryPanel,
  useDiscovery,
} from '@/app/(app)/_components/discovery';
import { Favicon } from '@/app/(app)/_components/favicon';
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

function getPrimaryProbeError(
  failed?: {
    error: string;
    parseErrors?: string[];
  } | null
): string {
  if (!failed) return 'Endpoint probe failed';
  if (Array.isArray(failed.parseErrors) && failed.parseErrors.length > 0) {
    return failed.parseErrors[0] ?? failed.error;
  }
  return failed.error || 'Endpoint probe failed';
}

export const RegisterResourceForm = () => {
  const [url, setUrl] = useState('');
  const [httpWarning, setHttpWarning] = useState(false);
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
    batchTestProgress,
    testedResources,
    failedResources,
    retryResource,
    authModeMap,
    invalidResourcesMap,
  } = useDiscovery({
    url,
  });

  const registerMutation = api.public.resources.register.useMutation();

  const normalizedUrl = useMemo(() => normalizeUrl(url.trim()), [url]);

  const hasDiscoveryResources =
    discoveryFound && actualDiscoveredResources.length > 0;

  // After batch test completes, count passing paid resources + SIWX (free) endpoints.
  // SIWX endpoints aren't probed, so they aren't in testedResources — add them separately.
  // Before batch test, fall back to total discovered count.
  const batchTestComplete =
    testedResources.length > 0 || failedResources.length > 0;
  const siwxCount = actualDiscoveredResources.filter(
    url => authModeMap[url] === 'siwx'
  ).length;
  const registrableResourceCount = batchTestComplete
    ? testedResources.length + siwxCount
    : actualDiscoveredResources.length;

  const canUseManualMode = isValidUrl && !isOriginOnly;

  const manualTargets = canUseManualMode ? [normalizedUrl] : [];

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
  const currentManualFailed =
    failedResourceByUrl.get(normalizedUrl) ??
    (failedResources.length === 1 ? failedResources[0] : undefined);

  const activeBulkResult = manualResult ?? bulkData ?? null;
  const activeSummaryOrigin = manualResult?.origin ?? urlOrigin;

  const resetStateForNewRun = () => {
    setManualResult(null);
    setManualProgress(null);
    resetBulk();
  };

  const handleUrlChange = (nextUrl: string) => {
    setUrl(nextUrl);
    setManualResult(null);
    setManualProgress(null);
    resetBulk();
  };

  const handleRegisterDiscovered = () => {
    setManualResult(null);
    setManualProgress(null);
    handleRegisterAll();
  };

  const handleRegisterManual = async () => {
    if (manualTargets.length === 0 || isRegisteringManual) {
      return;
    }

    await runManualRegistration(manualTargets);
  };

  const runManualRegistration = async (targets: string[]) => {
    if (targets.length === 0 || isRegisteringManual) {
      return;
    }

    resetStateForNewRun();
    setIsRegisteringManual(true);

    let registered = 0;
    let originId: string | undefined;
    const failedDetails: { url: string; error: string; status?: number }[] = [];

    for (let index = 0; index < targets.length; index += 1) {
      const targetUrl = targets[index] ?? '';
      setManualProgress({ current: index + 1, total: targets.length });

      try {
        const result = await registerMutation.mutateAsync({
          url: targetUrl,
        });

        if (result.success) {
          registered += 1;
          const parsedSuccessResult =
            registerSuccessResultSchema.safeParse(result);
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
      total: targets.length,
      failed: failedDetails.length,
      failedDetails,
      originId,
      origin: safeGetOrigin(targets[0] ?? ''),
    });

    setIsRegisteringManual(false);
  };

  const handleRegisterCurrentUrlOnly = async () => {
    if (!canUseManualMode || isRegisteringManual) {
      return;
    }

    await runManualRegistration([normalizedUrl]);
  };

  const isLoading = isRegisteringAll || isRegisteringManual;

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center h-12 rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <span className="pl-3 text-base text-muted-foreground select-none">
              https://
            </span>
            <input
              type="text"
              placeholder="api.example.com"
              value={url.replace(/^https?:\/\//, '')}
              onChange={event => {
                const value = event.target.value;
                setHttpWarning(value.startsWith('http://'));
                const raw = value.replace(/^https?:\/\//, '');
                handleUrlChange(`https://${raw}`);
              }}
              className="flex-1 h-full bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          {httpWarning && (
            <p className="text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1.5">
              <TriangleAlert className="size-3 shrink-0" />
              x402 requires HTTPS. We&apos;ve upgraded your URL automatically.
            </p>
          )}
        </div>

        {/* Primary action */}
        {hasDiscoveryResources ? (
          <div className="flex gap-2">
            <Button
              variant="turbo"
              disabled={
                isLoading ||
                isBatchTestLoading ||
                (failedResources.length > 0 && testedResources.length === 0)
              }
              onClick={handleRegisterDiscovered}
              className="flex-1"
            >
              {isRegisteringAll ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Registering resources...
                </>
              ) : isBatchTestLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  {batchTestProgress
                    ? `Checking ${batchTestProgress.checked}/${batchTestProgress.total} endpoints...`
                    : `Checking ${actualDiscoveredResources.length} endpoints...`}
                </>
              ) : batchTestComplete &&
                failedResources.length > 0 &&
                testedResources.length === 0 ? (
                `0 valid resources`
              ) : (
                `Add API (${registrableResourceCount} resources)`
              )}
            </Button>
            {canUseManualMode && (
              <Button
                variant="outline"
                disabled={isLoading}
                onClick={() => {
                  void handleRegisterCurrentUrlOnly();
                }}
              >
                {isRegisteringManual ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'This URL only'
                )}
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="turbo"
            disabled={
              manualTargets.length === 0 ||
              isLoading ||
              isBatchTestLoading ||
              !isValidUrl ||
              (!!currentManualFailed && !currentManualTested)
            }
            onClick={() => {
              void handleRegisterManual();
            }}
            className="w-full"
          >
            {isRegisteringManual ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                {manualProgress
                  ? `Checking ${manualProgress.current}/${manualProgress.total}`
                  : 'Registering...'}
              </>
            ) : manualTargets.length > 1 ? (
              `Register ${manualTargets.length} URLs`
            ) : (
              'Add'
            )}
          </Button>
        )}
      </div>

      {/* Probe result — inline, no separate card */}
      {url.trim().length > 0 &&
        (() => {
          const strippedDomain = url.replace(/^https?:\/\//, '').trim();
          const hasTld = strippedDomain.includes('.');
          const showInvalidDomain = strippedDomain.length > 0 && !hasTld;

          return (
            <div className="space-y-4">
              {showInvalidDomain && (
                <p className="text-sm text-red-600">
                  Enter a valid domain (e.g. example.com).
                </p>
              )}

              {!showInvalidDomain && isValidUrl && isDiscoveryLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="size-4 animate-spin" />
                  Checking for discoverable endpoints...
                </div>
              )}

              {!showInvalidDomain &&
                isValidUrl &&
                !isDiscoveryLoading &&
                hasDiscoveryResources && (
                  <ProbeResult
                    preview={preview}
                    urlOrigin={urlOrigin}
                    resources={actualDiscoveredResources}
                    testedResources={testedResources}
                    failedResources={failedResources}
                    isBatchTestLoading={isBatchTestLoading}
                    authModeMap={authModeMap}
                    invalidResourcesMap={invalidResourcesMap}
                  />
                )}

              {!showInvalidDomain &&
                isValidUrl &&
                !isDiscoveryLoading &&
                !hasDiscoveryResources &&
                isOriginOnly && (
                  <div className="text-sm space-y-1">
                    <p className="text-red-600">
                      {discoveryError?.includes('TypeError')
                        ? "Couldn't reach this URL."
                        : (discoveryError ??
                          'No discovery document found at this origin.')}
                    </p>
                    {!discoveryError?.includes('TypeError') && (
                      <DiscoveryFixHint noDiscovery />
                    )}
                  </div>
                )}

              {!showInvalidDomain &&
                isValidUrl &&
                !isDiscoveryLoading &&
                !hasDiscoveryResources &&
                !isOriginOnly && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {isBatchTestLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="size-3 animate-spin" />
                        Testing endpoint...
                      </div>
                    ) : currentManualTested ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <Check className="size-3" />
                        Valid 402 response.
                      </div>
                    ) : null}
                  </div>
                )}
            </div>
          );
        })()}

      {/* Errors — endpoints that won't be registered */}
      {(() => {
        if (
          activeBulkResult ||
          isBatchTestLoading ||
          failedResources.length === 0
        )
          return null;

        const isV1Issue =
          failedResources.length > 0 &&
          failedResources.every(r => r.error?.includes('v1 response detected'));

        return (
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <button className="text-xs text-red-600 dark:text-red-500 flex items-center gap-1 hover:text-red-700 transition-colors">
                <ChevronDown className="size-3" />
                {failedResources.length} endpoint
                {failedResources.length === 1 ? '' : 's'} with errors
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              <p className="text-xs text-muted-foreground">
                <strong>
                  {failedResources.length} endpoint
                  {failedResources.length === 1 ? '' : 's'} won&apos;t be
                  registered.
                </strong>{' '}
                {isV1Issue
                  ? 'This endpoint returns an x402 v1 response. x402scan only supports v2 — update your paywall to return the v2 format.'
                  : 'They need to return a 402 payment challenge — ensure the x402 paywall runs before request validation, or mark the required parameters in your OpenAPI spec so we can probe automatically. If these endpoints are free (not x402-paid), add "security": [] to their OpenAPI definition to exclude them from probing.'}
              </p>
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {failedResources.map((failed, idx) => (
                  <FailedResourceRow
                    key={`${failed.url}-${idx}`}
                    url={failed.url}
                    error={getPrimaryProbeError(failed)}
                    statusCode={failed.statusCode}
                    issues={failed.issues}
                  />
                ))}
              </div>
              <DiscoveryFixHint
                className="font-medium"
                failedResources={failedResources.map(r => ({
                  url: r.url,
                  error: getPrimaryProbeError(r),
                  status: r.statusCode,
                }))}
              />
            </CollapsibleContent>
          </Collapsible>
        );
      })()}

      {/* Bulk result */}
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
          onRetryResource={retryResource}
        />
      ) : null}

      {activeBulkResult?.originId ? (
        <Link href={`/server/${activeBulkResult.originId}`}>
          <Button variant="outline" className="w-full">
            View your API page &rarr;
          </Button>
        </Link>
      ) : null}

      {bulkError && <p className="text-sm text-red-600">{bulkError}</p>}

      {registerMutation.error && (
        <p className="text-sm text-red-600">{registerMutation.error.message}</p>
      )}
    </div>
  );
};

function FailedResourceRow({
  url,
  error,
  statusCode,
  issues,
}: {
  url: string;
  error: string;
  statusCode?: number;
  issues?: { code: string; message: string }[];
}) {
  const pathname = (() => {
    try {
      return decodeURIComponent(new URL(url).pathname);
    } catch {
      return url;
    }
  })();

  return (
    <div className="p-3 bg-muted/50 rounded text-xs space-y-1">
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground shrink-0">URL:</span>
        <span className="font-mono break-all">{pathname}</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground shrink-0">Error:</span>
        <span className="text-red-600 wrap-break-word">
          {statusCode && <span className="font-mono mr-1">[{statusCode}]</span>}
          {error}
        </span>
      </div>

      {Array.isArray(issues) && issues.length > 0 && (
        <div className="pt-1">
          <p className="text-muted-foreground mb-1">Validation details:</p>
          <ul className="space-y-1 list-disc list-inside">
            {issues.map((issue, i) => (
              <li key={i} className="text-red-600 font-mono text-[10px]">
                {issue.code}: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProbeResult({
  preview,
  urlOrigin,
  resources,
  testedResources = [],
  failedResources = [],
  isBatchTestLoading = false,
  authModeMap = {},
  invalidResourcesMap = {},
}: {
  preview: {
    favicon: string | null;
    title?: string | null;
    description?: string | null;
  } | null;
  urlOrigin: string | null;
  resources: string[];
  testedResources?: { url: string; warnings?: { code: string }[] }[];
  failedResources?: { url: string }[];
  isBatchTestLoading?: boolean;
  authModeMap?: Record<string, string>;
  invalidResourcesMap?: Record<string, { invalid: boolean; reason?: string }>;
}) {
  const testedUrls = useMemo(
    () => new Set(testedResources.map(r => r.url)),
    [testedResources]
  );
  const warningUrls = useMemo(
    () =>
      new Set(
        testedResources
          .filter(r => r.warnings && r.warnings.length > 0)
          .map(r => r.url)
      ),
    [testedResources]
  );
  const failedUrls = useMemo(
    () => new Set(failedResources.map(r => r.url)),
    [failedResources]
  );
  const siwxUrls = useMemo(
    () =>
      new Set(
        Object.entries(authModeMap)
          .filter(([, mode]) => mode === 'siwx')
          .map(([url]) => url)
      ),
    [authModeMap]
  );
  const nonPaidUrls = useMemo(() => {
    const paid = new Set(['paid', 'apiKey+paid']);
    return new Set(
      resources.filter(url => {
        const mode = authModeMap[url];
        // Only mark as non-paid if discovery explicitly classified it
        // as non-paid. If authMode is missing, don't pre-judge.
        return mode !== undefined && mode !== 'siwx' && !paid.has(mode);
      })
    );
  }, [resources, authModeMap]);
  const invalidUrls = useMemo(
    () =>
      new Set(
        Object.entries(invalidResourcesMap)
          .filter(([, info]) => info.invalid)
          .map(([url]) => url)
      ),
    [invalidResourcesMap]
  );
  // Sort: errors → warnings → free (SIWX) → verified → skipped
  const sortedResources = useMemo(() => {
    const priority = (url: string) => {
      if (invalidUrls.has(url) || failedUrls.has(url)) return 0;
      if (warningUrls.has(url)) return 1;
      if (siwxUrls.has(url)) return 2;
      if (testedUrls.has(url)) return 3;
      return 4; // non-paid — skipped
    };
    return [...resources].sort((a, b) => priority(a) - priority(b));
  }, [resources, invalidUrls, failedUrls, warningUrls, siwxUrls, testedUrls]);

  const [expanded, setExpanded] = useState(false);
  const previewResources = expanded
    ? sortedResources
    : sortedResources.slice(0, 8);
  const hiddenCount = expanded
    ? 0
    : sortedResources.length - previewResources.length;

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        {preview?.favicon ? (
          <Favicon
            url={preview.favicon}
            className="size-8 rounded-md border bg-background shrink-0"
          />
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative shrink-0 cursor-help">
                  <Favicon
                    url={null}
                    className="size-8 rounded-md border bg-background"
                  />
                  <CircleHelp className="absolute -right-1 -top-1 size-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                Add a favicon to help your API stand out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {preview?.title ?? urlOrigin ?? 'Discovered API'}
          </p>
          {preview?.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {preview.description}
            </p>
          )}
        </div>
      </div>
      {!preview?.favicon && (
        <p className="text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1.5">
          <TriangleAlert className="size-3 shrink-0" />
          Serve a <code className="font-mono">/favicon.ico</code> at your API
          root to display an icon.
        </p>
      )}
      {isBatchTestLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
          <Loader2 className="size-3 animate-spin" />
          Verifying {resources.length} endpoints...
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left"
        >
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {previewResources.map(resource => (
              <li
                key={resource}
                className="font-mono truncate flex items-center gap-1.5"
              >
                {nonPaidUrls.has(resource) ? (
                  <Minus className="size-3 text-muted-foreground/40 shrink-0" />
                ) : invalidUrls.has(resource) ? (
                  <X className="size-3 text-red-500 shrink-0" />
                ) : siwxUrls.has(resource) ? (
                  <Check className="size-3 text-green-600 shrink-0" />
                ) : warningUrls.has(resource) ? (
                  <TriangleAlert className="size-3 text-yellow-500 shrink-0" />
                ) : testedUrls.has(resource) ? (
                  <Check className="size-3 text-green-600 shrink-0" />
                ) : failedUrls.has(resource) ? (
                  <X className="size-3 text-red-500 shrink-0" />
                ) : null}
                <span
                  className={
                    nonPaidUrls.has(resource)
                      ? 'line-through text-muted-foreground/40'
                      : undefined
                  }
                >
                  {toPathLabel(resource)}
                </span>
              </li>
            ))}
            {!expanded && hiddenCount > 0 && (
              <li className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                + {hiddenCount} more
              </li>
            )}
            {expanded && sortedResources.length > 8 && (
              <li className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                show less
              </li>
            )}
          </ul>
        </button>
      )}
    </div>
  );
}
