'use client';

import { useMemo, useState } from 'react';

import {
  Check,
  ChevronDown,
  Loader2,
  Plus,
  CircleHelp,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    retryResource,
    authModeMap,
    invalidResourcesMap,
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

  // After batch test completes, count only passing resources.
  // Before batch test, fall back to total discovered count.
  const batchTestComplete =
    testedResources.length > 0 || failedResources.length > 0;
  const registrableResourceCount = batchTestComplete
    ? testedResources.length
    : actualDiscoveredResources.length;

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
  const currentManualFailed =
    failedResourceByUrl.get(normalizedUrl) ??
    (failedResources.length === 1 ? failedResources[0] : undefined);

  const activeBulkResult = manualResult ?? bulkData ?? null;
  const activeSummaryOrigin = manualResult?.origin ?? urlOrigin;
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

    return Object.fromEntries(
      entries.map(header => [header.name, header.value])
    );
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
    resetBulk();
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
          headers: requestHeaders,
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

  // Show advanced only after discovery fails or user has manual URLs
  const showAdvanced =
    (isValidUrl && !isDiscoveryLoading && !hasDiscoveryResources) ||
    manualUrls.length > 0 ||
    headers.length > 0;

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
          {manualListError && (
            <p className="text-xs text-red-600">{manualListError}</p>
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
                  {`Verifying ${actualDiscoveredResources.length} endpoints...`}
                </>
              ) : batchTestComplete && registrableResourceCount === 0 ? (
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
                    warningUrls={testedResources
                      .filter(r =>
                        r.warnings.some(w => w.code === 'MISSING_INPUT_SCHEMA')
                      )
                      .map(r => r.url)}
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

      {/* Advanced — only when relevant */}
      {showAdvanced && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors flex items-center gap-1">
              Advanced
              <ChevronDown className="size-3" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            {/* Headers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Custom Headers
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    setHeaders(current => [...current, { name: '', value: '' }])
                  }
                  className="size-fit px-1 text-xs"
                >
                  <Plus className="size-3 mr-1" />
                  Add
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
                          itemIndex === index
                            ? { ...item, name: event.target.value }
                            : item
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
                          itemIndex === index
                            ? { ...item, value: event.target.value }
                            : item
                        )
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setHeaders(current =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    className="shrink-0"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Manual URLs */}
            {!hasDiscoveryResources && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Manual URLs
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={handleAddCurrentUrl}
                    disabled={!canAddCurrentUrl || isRegisteringManual}
                    className="size-fit px-1 text-xs"
                  >
                    <Plus className="size-3 mr-1" />
                    Add Current URL
                  </Button>
                </div>
                {manualUrls.length > 0 && (
                  <ul className="space-y-1">
                    {manualUrls.map(item => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-xs"
                      >
                        <code className="font-mono break-all flex-1 text-muted-foreground">
                          {item}
                        </code>
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
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}

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
        const missingSchemaResources = testedResources.filter(r =>
          r.warnings.some(w => w.code === 'MISSING_INPUT_SCHEMA')
        );

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
                  : 'They need to return a 402 payment challenge — ensure the x402 paywall runs before request validation, or mark the required parameters in your OpenAPI spec so we can probe automatically.'}
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
                needsSetup={
                  failedResources.length > 0 && testedResources.length === 0
                }
                v1Migration={isV1Issue}
                failedResources={failedResources.map(r => ({
                  url: r.url,
                  error: getPrimaryProbeError(r),
                  status: r.statusCode,
                }))}
                missingSchemaResources={missingSchemaResources.map(r => r.url)}
              />
            </CollapsibleContent>
          </Collapsible>
        );
      })()}

      {/* Warnings — registered but with issues */}
      {(() => {
        const missingSchemaResources = testedResources.filter(r =>
          r.warnings.some(w => w.code === 'MISSING_INPUT_SCHEMA')
        );

        if (
          activeBulkResult ||
          isBatchTestLoading ||
          missingSchemaResources.length === 0
        )
          return null;

        return (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button className="text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1 hover:text-yellow-700 transition-colors">
                <ChevronDown className="size-3" />
                {missingSchemaResources.length} endpoint
                {missingSchemaResources.length === 1 ? '' : 's'} with warnings
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              <p className="text-xs text-muted-foreground">
                <strong>
                  {missingSchemaResources.length} endpoint
                  {missingSchemaResources.length === 1 ? '' : 's'} missing input
                  schema.
                </strong>{' '}
                These will still be registered, but agents won&apos;t know what
                request to send. Add request/response schemas to your OpenAPI
                spec to fix this.
              </p>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {missingSchemaResources.map((r, idx) => (
                  <li
                    key={`${r.url}-${idx}`}
                    className="font-mono truncate flex items-center gap-1.5"
                  >
                    <TriangleAlert className="size-3 text-yellow-500 shrink-0" />
                    {toPathLabel(r.url)}
                  </li>
                ))}
              </ul>
              <DiscoveryFixHint missingSchema />
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
  warningUrls = [],
}: {
  preview: {
    favicon: string | null;
    title?: string | null;
    description?: string | null;
  } | null;
  urlOrigin: string | null;
  resources: string[];
  testedResources?: { url: string }[];
  failedResources?: { url: string }[];
  isBatchTestLoading?: boolean;
  authModeMap?: Record<string, string>;
  invalidResourcesMap?: Record<string, { invalid: boolean; reason?: string }>;
  warningUrls?: string[];
}) {
  const testedUrls = useMemo(
    () => new Set(testedResources.map(r => r.url)),
    [testedResources]
  );
  const failedUrls = useMemo(
    () => new Set(failedResources.map(r => r.url)),
    [failedResources]
  );
  const warningUrlSet = useMemo(() => new Set(warningUrls), [warningUrls]);
  const siwxUrls = useMemo(
    () =>
      new Set(
        Object.entries(authModeMap)
          .filter(([, mode]) => mode === 'siwx')
          .map(([url]) => url)
      ),
    [authModeMap]
  );
  const invalidUrls = useMemo(
    () =>
      new Set(
        Object.entries(invalidResourcesMap)
          .filter(([, info]) => info.invalid)
          .map(([url]) => url)
      ),
    [invalidResourcesMap]
  );
  const sortedResources = useMemo(() => {
    const priority = (url: string) => {
      if (invalidUrls.has(url) || failedUrls.has(url)) return 0;
      return 2;
    };
    return [...resources].sort((a, b) => priority(a) - priority(b));
  }, [resources, invalidUrls, failedUrls]);

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
                {invalidUrls.has(resource) ? (
                  <X className="size-3 text-red-500 shrink-0" />
                ) : siwxUrls.has(resource) ? (
                  <Check className="size-3 text-primary shrink-0" />
                ) : warningUrlSet.has(resource) ? (
                  <TriangleAlert className="size-3 text-yellow-500 shrink-0" />
                ) : testedUrls.has(resource) ? (
                  <Check className="size-3 text-green-600 shrink-0" />
                ) : failedUrls.has(resource) ? (
                  <X className="size-3 text-red-500 shrink-0" />
                ) : null}
                {toPathLabel(resource)}
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
