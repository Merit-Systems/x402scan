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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { DiscoveryActions } from '@/app/(app)/_components/discovery/discovery-actions';
import { Favicon } from '@/app/(app)/_components/favicon';
import { normalizeUrl } from '@/lib/url';
import { resourceKey } from '@/lib/resource-key';
import { api } from '@/trpc/client';
import type { DiscoveredResource } from '@/types/discovery';
import Link from 'next/link';
import { z } from 'zod';

const CONTACT_EMAIL_PROMPT = `My openapi.json is missing an info.contact.email field. Add it so I can claim my free merchant dashboard on Poncho (tryponcho.com).

In my openapi.json, add or update the top-level "info" object to include a "contact" field with my email:

{
  "info": {
    "title": "...",
    "version": "...",
    "contact": {
      "email": "me@example.com"
    }
  }
}

Replace me@example.com with my actual email. This is part of the standard OpenAPI 3.x spec (info.contact.email). Do not remove any existing fields — just add the contact object if missing.`;

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
    type: 'parseErrors' | 'no402' | 'tunnel';
    message?: string;
    parseErrors?: string[];
  };
}): string {
  if (result.error.type === 'tunnel') {
    return result.error.message ?? 'Tunnel URLs are not supported';
  }

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

const rk = (r: { url: string; method?: string }) =>
  resourceKey(r.url, r.method);

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
    skippedResources,
    siwxResourceCount,
    contactEmail,
  } = useDiscovery({
    url,
  });

  const registerMutation = api.public.resources.register.useMutation();

  const normalizedUrl = useMemo(() => normalizeUrl(url.trim()), [url]);

  const hasDiscoveryResources =
    discoveryFound && actualDiscoveredResources.length > 0;

  // After batch test completes, count passing paid resources + SIWX (free) endpoints.
  // SIWX endpoints aren't probed — they're counted separately from discovery data.
  // Before batch test, fall back to total discovered count.
  const batchTestComplete =
    testedResources.length > 0 || failedResources.length > 0;
  const registrableResourceCount = batchTestComplete
    ? testedResources.length + siwxResourceCount
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
                !!activeBulkResult ||
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

      {/* Probe result — inline, no separate card. Hidden post-registration. */}
      {!activeBulkResult &&
        url.trim().length > 0 &&
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
                    contactEmail={contactEmail}
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
                missingContactEmail={!contactEmail}
              />
            </CollapsibleContent>
          </Collapsible>
        );
      })()}

      {/* Warnings — endpoints that will register but have issues */}
      {(() => {
        if (activeBulkResult || isBatchTestLoading) return null;
        const resourcesWithWarnings = testedResources.filter(
          r => r.warnings && r.warnings.length > 0
        );
        if (resourcesWithWarnings.length === 0) return null;

        return (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <button className="text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1 hover:text-yellow-700 transition-colors">
                <ChevronDown className="size-3" />
                {resourcesWithWarnings.length} endpoint
                {resourcesWithWarnings.length === 1 ? '' : 's'} with warnings
                (Not blocking)
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              <p className="text-xs text-muted-foreground">
                These endpoints will still be registered, but have issues that
                may affect agent compatibility.
              </p>
              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {resourcesWithWarnings.map((r, idx) => (
                  <div
                    key={`${r.url}-${idx}`}
                    className="p-2 bg-muted/50 rounded border text-xs space-y-1"
                  >
                    <div className="font-mono text-muted-foreground truncate">
                      {toPathLabel(r.url)}
                    </div>
                    {r.warnings?.map((w, wi) => (
                      <div
                        key={wi}
                        className="text-yellow-600 dark:text-yellow-500"
                      >
                        {w.message}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <DiscoveryFixHint
                className="font-medium"
                warnings={resourcesWithWarnings.flatMap(r =>
                  (r.warnings ?? []).map(w => ({
                    url: r.url,
                    error: w.message,
                  }))
                )}
                missingContactEmail={!contactEmail}
              />
            </CollapsibleContent>
          </Collapsible>
        );
      })()}

      {/* Unprotected endpoints — skipped, not an error */}
      {!activeBulkResult && skippedResources.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <button className="text-xs text-yellow-600 dark:text-yellow-500 flex items-center gap-1 hover:text-yellow-700 transition-colors">
              <ChevronDown className="size-3" />
              {skippedResources.length} unprotected endpoint
              {skippedResources.length === 1 ? '' : 's'} skipped
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <p className="text-xs text-muted-foreground">
              These endpoints have no x402 paywall and won&apos;t be registered.
              If they should be paid, add x402 payment middleware. If they are
              intentionally free, add{' '}
              <code className="font-mono bg-muted px-1 rounded text-[11px]">
                &quot;security&quot;: []
              </code>{' '}
              to their OpenAPI definition to suppress this notice.
            </p>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {skippedResources.map((r, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 bg-muted/50 rounded text-xs font-mono text-muted-foreground"
                >
                  {toPathLabel(r.url)}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

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
        <>
          <Link href={`/server/${activeBulkResult.originId}`}>
            <Button variant="outline" className="w-full">
              View your API page &rarr;
            </Button>
          </Link>
          <PostRegistrationDialog
            contactEmail={contactEmail}
            originId={activeBulkResult.originId}
          />
        </>
      ) : null}

      {bulkError && <p className="text-sm text-red-600">{bulkError}</p>}

      {registerMutation.error && (
        <p className="text-sm text-red-600">{registerMutation.error.message}</p>
      )}
    </div>
  );
};

function PostRegistrationDialog({
  contactEmail,
  originId,
}: {
  contactEmail: string | undefined;
  originId: string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        {contactEmail ? (
          <>
            <DialogHeader>
              <DialogTitle>You&apos;re all set</DialogTitle>
              <DialogDescription>
                We detected your contact email in your openapi.json.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                You&apos;re eligible for a free merchant dashboard on{' '}
                <Link
                  href="https://tryponcho.com"
                  target="_blank"
                  className="underline font-medium text-foreground"
                >
                  Poncho
                </Link>{' '}
                with:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Usage analytics for your endpoints</li>
                <li>Endpoint health monitoring</li>
                <li>A shareable link to onboard your users instantly</li>
              </ul>
              <p>
                Log into{' '}
                <Link
                  href="https://tryponcho.com"
                  target="_blank"
                  className="underline font-medium text-foreground"
                >
                  tryponcho.com
                </Link>{' '}
                with the same email to access your dashboard.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild className="flex-1">
                <Link href={`/server/${originId}`}>View your API page</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="https://tryponcho.com" target="_blank">
                  Open Poncho
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Want usage analytics and a shareable onboarding link?
              </DialogTitle>
              <DialogDescription>
                Add your contact email to unlock your free merchant dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Add{' '}
                <code className="font-mono bg-muted px-1 rounded text-xs">
                  info.contact.email
                </code>{' '}
                to your openapi.json to unlock your free merchant dashboard on{' '}
                <Link
                  href="https://tryponcho.com"
                  target="_blank"
                  className="underline font-medium text-foreground"
                >
                  Poncho
                </Link>
                :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>See how agents use your API</li>
                <li>Monitor endpoint health</li>
                <li>Share a one-click onboarding link for new users</li>
              </ul>
              <p>
                No extra cost. Log into tryponcho.com with the same email to
                access your dashboard.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button asChild className="flex-1">
                <Link href={`/server/${originId}`}>View your API page</Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/discovery">Learn more</Link>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
  contactEmail,
}: {
  preview: {
    favicon: string | null;
    title?: string | null;
    description?: string | null;
  } | null;
  urlOrigin: string | null;
  resources: DiscoveredResource[];
  testedResources?: {
    url: string;
    method?: string;
    warnings?: { code: string }[];
  }[];
  failedResources?: { url: string; method?: string }[];
  isBatchTestLoading?: boolean;
  authModeMap?: Record<string, string>;
  invalidResourcesMap?: Record<string, { invalid: boolean; reason?: string }>;
  contactEmail?: string | null;
}) {
  const testedKeys = useMemo(
    () => new Set(testedResources.map(rk)),
    [testedResources]
  );
  const warningKeys = useMemo(
    () =>
      new Set(
        testedResources.filter(r => r.warnings && r.warnings.length > 0).map(rk)
      ),
    [testedResources]
  );
  const failedKeys = useMemo(
    () => new Set(failedResources.map(rk)),
    [failedResources]
  );
  const siwxKeys = useMemo(
    () =>
      new Set(
        Object.entries(authModeMap)
          .filter(([, mode]) => mode === 'siwx')
          .map(([key]) => key)
      ),
    [authModeMap]
  );
  const nonPaidKeys = useMemo(() => {
    const paid = new Set(['paid', 'apiKey+paid']);
    return new Set(
      resources
        .filter(r => {
          const mode = authModeMap[rk(r)];
          return mode !== undefined && mode !== 'siwx' && !paid.has(mode);
        })
        .map(rk)
    );
  }, [resources, authModeMap]);
  const invalidKeys = useMemo(
    () =>
      new Set(
        Object.entries(invalidResourcesMap)
          .filter(([, info]) => info.invalid)
          .map(([key]) => key)
      ),
    [invalidResourcesMap]
  );
  // Sort: errors → warnings → free (SIWX) → verified → skipped
  const sortedResources = useMemo(() => {
    const priority = (r: DiscoveredResource) => {
      const k = rk(r);
      if (invalidKeys.has(k) || failedKeys.has(k)) return 0;
      if (warningKeys.has(k)) return 1;
      if (siwxKeys.has(k)) return 2;
      if (testedKeys.has(k)) return 3;
      return 4; // non-paid — skipped
    };
    return [...resources].sort((a, b) => priority(a) - priority(b));
  }, [resources, invalidKeys, failedKeys, warningKeys, siwxKeys, testedKeys]);

  const [expanded, setExpanded] = useState(false);
  const previewResources = expanded
    ? sortedResources
    : sortedResources.slice(0, 8);
  const hiddenCount = expanded
    ? 0
    : sortedResources.length - previewResources.length;

  // Check if any URLs appear with multiple methods — show method badges when needed
  const showMethodBadges = useMemo(() => {
    const urls = new Set<string>();
    for (const r of resources) {
      if (urls.has(r.url)) return true;
      urls.add(r.url);
    }
    return false;
  }, [resources]);

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
      {!contactEmail && (
        <div className="text-xs text-yellow-600 dark:text-yellow-500 space-y-1.5">
          <p className="flex items-start gap-1.5">
            <TriangleAlert className="size-3 shrink-0 mt-0.5" />
            <span>
              Add{' '}
              <code className="font-mono bg-muted px-1 rounded text-[11px]">
                info.contact.email
              </code>{' '}
              to your openapi.json to unlock your free merchant dashboard on{' '}
              <Link
                href="https://tryponcho.com"
                target="_blank"
                className="underline"
              >
                Poncho
              </Link>{' '}
              — usage analytics, endpoint health monitoring, and a shareable
              onboarding link for your users.
            </span>
          </p>
          <p className="pl-[18px] text-foreground">
            <DiscoveryActions
              label="Have your agent add it with this prompt"
              customPrompt={CONTACT_EMAIL_PROMPT}
            />{' '}
            or{' '}
            <Link
              href="/discovery#merchant-dashboard"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              learn more
            </Link>
          </p>
        </div>
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
            {previewResources.map(resource => {
              const k = rk(resource);
              return (
                <li
                  key={k}
                  className="font-mono truncate flex items-center gap-1.5"
                >
                  {nonPaidKeys.has(k) ? (
                    <Minus className="size-3 text-muted-foreground/40 shrink-0" />
                  ) : invalidKeys.has(k) ? (
                    <X className="size-3 text-red-500 shrink-0" />
                  ) : siwxKeys.has(k) ? (
                    <Check className="size-3 text-blue-500 shrink-0" />
                  ) : warningKeys.has(k) ? (
                    <TriangleAlert className="size-3 text-yellow-500 shrink-0" />
                  ) : testedKeys.has(k) ? (
                    <Check className="size-3 text-green-600 shrink-0" />
                  ) : failedKeys.has(k) ? (
                    <X className="size-3 text-red-500 shrink-0" />
                  ) : null}
                  <span
                    className={
                      nonPaidKeys.has(k)
                        ? 'line-through text-muted-foreground/40'
                        : undefined
                    }
                  >
                    {showMethodBadges && resource.method && (
                      <span className="text-[10px] font-semibold text-muted-foreground/70 mr-1">
                        {resource.method}
                      </span>
                    )}
                    {toPathLabel(resource.url)}
                  </span>
                </li>
              );
            })}
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
