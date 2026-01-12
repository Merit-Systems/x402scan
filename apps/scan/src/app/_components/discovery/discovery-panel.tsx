'use client';

import { useState } from 'react';
import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { Favicon } from '@/app/_components/favicon';
import { ResourceExecutor } from '@/app/_components/resources/executor';
import {
  createDummyResources,
  createDummyResourceOrigin,
  createDummyOgImage,
} from '@/app/developer/_components/dummy';

import type { Methods } from '@/types/x402';
import type { ParsedX402Response } from '@/lib/x402';
import { getOutputSchema } from '@/lib/x402';
import type { OgImage, ResourceOrigin } from '@x402scan/scan-db/types';

export interface OriginPreview {
  title: string | null;
  description: string | null;
  favicon: string | null;
  ogImages: { url: string; height?: number; width?: number }[];
  origin: string;
}

export interface TestedResource {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string | null;
  parsed: ParsedX402Response;
}

export interface FailedResource {
  url: string;
  error: string;
  status?: number;
  statusText?: string;
  body?: unknown;
}

export interface DiscoveryPanelProps {
  /** The origin being checked */
  origin: string | null;
  /** The URL the user entered (if not in discovery, shown separately) */
  enteredUrl?: string;
  /** Whether discovery is loading */
  isLoading: boolean;
  /** Whether discovery document was found */
  found: boolean;
  /** Discovery source: 'dns' or 'well-known' */
  source?: 'dns' | 'well-known';
  /** List of discovered resource URLs */
  resources: string[];
  /** Total count of resources */
  resourceCount: number;
  /** Whether bulk registration is in progress */
  isRegisteringAll: boolean;
  /** Bulk registration result */
  bulkResult?: {
    success: boolean;
    registered: number;
    total: number;
    failed: number;
  } | null;
  /** Called when "Register All" is clicked (required in register mode) */
  onRegisterAll?: () => void;
  /** Whether to show the Register All button */
  showRegisterButton?: boolean;
  /** Mode: 'register' for registration page, 'test' for developer page */
  mode?: 'register' | 'test';
  /** Origin preview data (favicon, OG, etc.) */
  preview?: OriginPreview | null;
  /** Whether preview is loading */
  isPreviewLoading?: boolean;
  /** Tested resources with x402 responses */
  testedResources?: TestedResource[];
  /** Failed resources with error details */
  failedResources?: FailedResource[];
  /** Whether batch test is loading */
  isBatchTestLoading?: boolean;
  /** Called when refresh is clicked */
  onRefresh?: () => void;
  /** URLs that are already registered */
  registeredUrls?: string[];
}

const ITEMS_PER_PAGE = 10;

export function DiscoveryPanel({
  origin,
  enteredUrl,
  isLoading,
  source,
  resources,
  resourceCount,
  isRegisteringAll,
  bulkResult,
  onRegisterAll,
  showRegisterButton = true,
  mode = 'register',
  preview,
  isPreviewLoading,
  testedResources = [],
  failedResources = [],
  isBatchTestLoading,
  onRefresh,
  registeredUrls = [],
}: DiscoveryPanelProps) {
  const [page, setPage] = useState(0);

  // Don't render anything if no origin
  if (!origin) return null;

  const isTestMode = mode === 'test';

  // Show bulk registration success (only in register mode)
  if (!isTestMode && bulkResult?.success) {
    return (
      <div className="flex items-center gap-3 p-4 border rounded-md bg-green-600/10 border-green-600/30">
        <CheckCircle className="size-6 text-green-600" />
        <div>
          <h2 className="font-semibold">Registration Complete</h2>
          <p className="text-sm text-muted-foreground">
            Successfully registered {bulkResult.registered} of{' '}
            {bulkResult.total} resources
            {bulkResult.failed > 0 && (
              <span className="text-yellow-600">
                {' '}
                ({bulkResult.failed} failed)
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Create maps for quick lookup
  const testedResourceMap = new Map(testedResources.map(r => [r.url, r]));
  const failedResourceMap = new Map(failedResources.map(r => [r.url, r]));

  // Pagination
  const totalPages = Math.ceil(resources.length / ITEMS_PER_PAGE);
  const paginatedResources = resources.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );
  const showPagination = resources.length > ITEMS_PER_PAGE;

  // Create origin object for display
  const originData = createOriginFromPreview(origin, preview);

  return (
    <div className="flex flex-col gap-2">
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 p-4 border rounded-md bg-muted/30">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Checking for discovery document...
          </span>
        </div>
      )}

      {/* Resources display - shows when we have resources (discovery or direct test) */}
      {!isLoading && resourceCount > 0 && (
        <div className="flex flex-col">
          {/* Header with refresh button */}
          {onRefresh && (
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isBatchTestLoading}
                className="gap-1"
              >
                <RefreshCw
                  className={cn('size-3', isBatchTestLoading && 'animate-spin')}
                />
                Refresh
              </Button>
            </div>
          )}

          {/* Origin Card */}
          {isPreviewLoading ? (
            <LoadingOriginCard />
          ) : (
            <OriginPreviewCard
              origin={originData}
              resourceCount={resourceCount}
            />
          )}

          {/* Resources list - detailed testing UI only in test mode */}
          {isTestMode ? (
            isBatchTestLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="pl-4 border-l pt-4 relative">
                    <div className="absolute left-0 top-[calc(2rem+5px)] w-4 h-px bg-border" />
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-muted px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-10 h-5" />
                          <Skeleton className="w-48 h-4" />
                        </div>
                        <Skeleton className="w-full h-3 mt-2" />
                      </CardHeader>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                className="flex flex-col gap-2"
              >
                {paginatedResources.map((resourceUrl, idx) => {
                  const tested = testedResourceMap.get(resourceUrl);

                  if (tested) {
                    // Check if we have a valid schema for ResourceExecutor
                    const outputSchema = getOutputSchema(tested.parsed);
                    const hasValidSchema = Boolean(outputSchema?.input);

                    if (hasValidSchema) {
                      // Render working resource with ResourceExecutor
                      return (
                        <DiscoveredResourceExecutor
                          key={resourceUrl}
                          resourceUrl={resourceUrl}
                          tested={tested}
                          idx={idx}
                          preview={preview}
                        />
                      );
                    }

                    // x402 parses but no input schema - show as incomplete
                    return (
                      <FailedResourceCard
                        key={resourceUrl}
                        resourceUrl={resourceUrl}
                        preview={preview}
                        testedResponse={tested}
                      />
                    );
                  }

                  // Render failed resource with checklist
                  const failedDetails = failedResourceMap.get(resourceUrl);
                  return (
                    <FailedResourceCard
                      key={resourceUrl}
                      resourceUrl={resourceUrl}
                      preview={preview}
                      failedDetails={failedDetails}
                    />
                  );
                })}
              </Accordion>
            )
          ) : (
            // Unified resource list for register mode
            <RegisterModeResourceList
              enteredUrl={enteredUrl}
              discoveredResources={paginatedResources}
              source={source}
              registeredUrls={registeredUrls}
            />
          )}

          {/* Pagination */}
          {showPagination && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Showing {page * ITEMS_PER_PAGE + 1}-
                {Math.min((page + 1) * ITEMS_PER_PAGE, resources.length)} of{' '}
                {resources.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Register All button */}
          {showRegisterButton && !isTestMode && onRegisterAll && (
            <Button
              variant="turbo"
              disabled={isRegisteringAll}
              onClick={onRegisterAll}
              className="w-full"
            >
              {isRegisteringAll ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                `Register All ${resourceCount} Resources`
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Wrapper for ResourceExecutor */
function DiscoveredResourceExecutor({
  resourceUrl,
  tested,
  idx,
  preview,
}: {
  resourceUrl: string;
  tested: TestedResource;
  idx: number;
  preview?: OriginPreview | null;
}) {
  const outputSchema = getOutputSchema(tested.parsed);
  const method =
    (outputSchema?.input?.method?.toUpperCase() as Methods) ??
    (tested.method as Methods);

  // Collect warnings for missing optional items
  const warnings: string[] = [];
  if (!outputSchema?.output) warnings.push('Output schema');
  if (!preview?.ogImages?.[0]?.url) warnings.push('OG image');
  if (!preview?.favicon) warnings.push('Favicon');

  return (
    <ResourceExecutor
      resource={createDummyResources({
        id: `discovered-${idx}`,
        resource: resourceUrl,
        x402Version: 1,
        originId: 'discovered',
      })}
      tags={[]}
      response={tested.parsed}
      bazaarMethod={method}
      hideOrigin
      isFlat={false}
      warnings={warnings}
    />
  );
}

/** Card for failed resources showing validation checklist */
function FailedResourceCard({
  resourceUrl,
  preview,
  failedDetails,
  testedResponse,
}: {
  resourceUrl: string;
  preview?: OriginPreview | null;
  failedDetails?: FailedResource;
  /** If provided, x402 parsed successfully but is missing schema */
  testedResponse?: TestedResource;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);

  const pathname = (() => {
    try {
      return new URL(resourceUrl).pathname;
    } catch {
      return resourceUrl;
    }
  })();

  // If we have a tested response, x402 parsed but missing schema
  const x402Parsed = Boolean(testedResponse);
  const hasAccepts = x402Parsed
    ? Boolean(testedResponse?.parsed?.accepts?.length)
    : false;
  const outputSchema = testedResponse ? getOutputSchema(testedResponse.parsed) : null;
  const hasInputSchema = Boolean(outputSchema?.input);
  const hasOutputSchema = Boolean(outputSchema?.output);

  // Determine checklist status based on error details or tested response
  const returns402 = x402Parsed || failedDetails?.status === 402;
  const errorMessage = x402Parsed
    ? 'Missing input schema'
    : (failedDetails?.error ?? 'Unknown error');

  return (
    <div className="pl-4 border-l pt-4 relative">
      <div className="absolute left-0 top-[calc(2rem+5px)] w-4 h-px bg-border" />
      <Card className="overflow-hidden border-red-500/30">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-left"
        >
          <CardHeader className="bg-muted px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="font-mono px-1 rounded-md text-xs bg-red-600/10 border border-red-600 text-red-600 shrink-0">
                  ERR
                </div>
                <span className="font-mono text-sm truncate">{pathname}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-red-500 truncate max-w-[200px]">
                  {errorMessage}
                </span>
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform text-muted-foreground',
                    showDetails && 'rotate-180'
                  )}
                />
              </div>
            </div>
          </CardHeader>
        </button>
        {showDetails && (
          <CardContent className="p-4 flex flex-col gap-3">
            <ValidationChecklist
              checks={[
                { label: 'Returns 402', ok: returns402 },
                { label: 'x402 parses', ok: x402Parsed },
                { label: 'Has accepts', ok: hasAccepts },
                { label: 'Input schema', ok: hasInputSchema },
                { label: 'Output schema', ok: hasOutputSchema },
                { label: 'OG image', ok: Boolean(preview?.ogImages?.[0]?.url) },
                { label: 'Favicon', ok: Boolean(preview?.favicon) },
              ]}
            />

            {/* Raw response - nested collapsible */}
            {(failedDetails?.body !== undefined || testedResponse?.parsed) && (
              <div className="border rounded-md bg-muted/30">
                <button
                  type="button"
                  onClick={() => setShowRawResponse(!showRawResponse)}
                  className="w-full flex items-center justify-between p-2 text-left"
                >
                  <span className="text-xs font-medium">Raw Response</span>
                  <ChevronDown
                    className={cn(
                      'size-3 transition-transform text-muted-foreground',
                      showRawResponse && 'rotate-180'
                    )}
                  />
                </button>
                {showRawResponse && (
                  <pre className="text-xs overflow-auto max-h-48 bg-background p-2 mx-2 mb-2 rounded border">
                    {testedResponse?.parsed
                      ? JSON.stringify(testedResponse.parsed, null, 2)
                      : typeof failedDetails?.body === 'string'
                        ? failedDetails.body
                        : JSON.stringify(failedDetails?.body, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/** Validation checklist grid */
function ValidationChecklist({
  checks,
}: {
  checks: { label: string; ok: boolean }[];
}) {
  return (
    <div className="border rounded-md bg-muted/30 p-3">
      <p className="text-xs font-medium mb-2">Validation Checklist</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {checks.map(({ label, ok }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs">
            {ok ? (
              <CheckCircle className="size-3 text-green-600" />
            ) : (
              <XCircle className="size-3 text-red-500" />
            )}
            <span
              className={cn(ok ? 'text-foreground' : 'text-muted-foreground')}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Unified resource list for register mode */
function RegisterModeResourceList({
  enteredUrl,
  discoveredResources,
  source,
  registeredUrls,
}: {
  enteredUrl?: string;
  discoveredResources: string[];
  source?: 'dns' | 'well-known';
  registeredUrls: string[];
}) {
  const [showAll, setShowAll] = useState(false);
  const registeredSet = new Set(registeredUrls);
  const INITIAL_LIMIT = 5;

  // Build unified list: entered URL first (if exists), then discovered
  const allResources: {
    url: string;
    source: 'entered' | 'dns' | 'well-known';
    isRegistered: boolean;
  }[] = [];

  if (enteredUrl) {
    allResources.push({
      url: enteredUrl,
      source: 'entered',
      isRegistered: registeredSet.has(enteredUrl),
    });
  }

  for (const url of discoveredResources) {
    allResources.push({
      url,
      source: source ?? 'well-known',
      isRegistered: registeredSet.has(url),
    });
  }

  if (allResources.length === 0) return null;

  const displayedResources = showAll
    ? allResources
    : allResources.slice(0, INITIAL_LIMIT);
  const hasMore = allResources.length > INITIAL_LIMIT;

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted text-muted-foreground text-xs">
            <th className="text-left px-3 py-2 font-medium">Resource</th>
            <th className="text-left px-3 py-2 font-medium">Source</th>
            <th className="text-left px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {displayedResources.map(
            ({ url, source: resourceSource, isRegistered }) => {
              const pathname = (() => {
                try {
                  return new URL(url).pathname;
                } catch {
                  return url;
                }
              })();

              return (
                <tr key={url} className="border-t">
                  <td className="px-3 py-2">
                    <span className="font-mono text-sm">{pathname}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        resourceSource === 'entered'
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {resourceSource === 'entered'
                        ? 'Manually Entered'
                        : resourceSource === 'dns'
                          ? '_x402 DNS TXT'
                          : '/.well-known/x402'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {isRegistered ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="size-3" />
                        Already Registered
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">New</span>
                    )}
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 border-t transition-colors"
        >
          {showAll
            ? 'Show less'
            : `Show ${allResources.length - INITIAL_LIMIT} more`}
        </button>
      )}
    </div>
  );
}

function createOriginFromPreview(
  origin: string,
  preview: OriginPreview | null | undefined
): ResourceOrigin & { ogImages: OgImage[] } {
  const ogImages: OgImage[] = (preview?.ogImages ?? [])
    .filter((img): img is { url: string } => Boolean(img?.url))
    .map((img, i) =>
      createDummyOgImage({
        id: `discovered-og-${i}`,
        originId: 'discovered',
        url: img.url,
        title: preview?.title ?? null,
        description: preview?.description ?? null,
        width: null,
        height: null,
      })
    );

  return createDummyResourceOrigin({
    id: 'discovered',
    origin: preview?.origin ?? origin,
    title: preview?.title ?? null,
    description: preview?.description ?? null,
    favicon: preview?.favicon ?? null,
    ogImages,
  });
}

function OriginPreviewCard({
  origin,
  resourceCount,
}: {
  origin: ResourceOrigin & { ogImages: OgImage[] };
  resourceCount: number;
}) {
  const hostname = (() => {
    try {
      return new URL(origin.origin).hostname;
    } catch {
      return origin.origin;
    }
  })();

  const hasMetadata =
    origin.title !== null ||
    origin.description !== null ||
    origin.ogImages.length > 0;

  return (
    <Card className="overflow-hidden flex w-full items-stretch">
      <div className="flex-1">
        <CardHeader
          className={cn(
            'space-y-0 flex flex-row items-center gap-2 bg-muted p-2 md:p-4',
            hasMetadata && 'border-b'
          )}
        >
          <Favicon url={origin.favicon} className="size-6" />
          <CardTitle className="font-bold text-base md:text-lg">
            {hostname}{' '}
            <span className="text-muted-foreground text-xs md:text-sm ml-2">
              {resourceCount} resource{resourceCount === 1 ? '' : 's'}
            </span>
          </CardTitle>
        </CardHeader>
        {hasMetadata && (
          <CardContent className="flex flex-row items-start justify-between gap-2 p-0">
            <div className="flex flex-col gap-2 p-4">
              <div>
                <h3
                  className={cn(
                    'font-medium text-sm md:text-base',
                    !origin.title && 'opacity-60'
                  )}
                >
                  {origin.title ?? 'No Title'}
                </h3>
                <p
                  className={cn(
                    'text-xs md:text-sm text-muted-foreground',
                    !origin.description && 'text-muted-foreground/60'
                  )}
                >
                  {origin.description ?? 'No Description'}
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </div>
      {origin.ogImages.length > 0 && (
        <div className="border-l hidden md:flex items-center justify-center bg-muted p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={origin.ogImages[0]!.url}
            alt={origin.title ?? ''}
            className="rounded-md max-h-24"
          />
        </div>
      )}
    </Card>
  );
}

function LoadingOriginCard() {
  return (
    <Card className="overflow-hidden flex w-full items-stretch">
      <div className="flex-1">
        <CardHeader className="space-y-0 flex flex-row items-center gap-2 bg-muted">
          <Skeleton className="size-6" />
          <Skeleton className="w-36 h-[16px] md:h-[18px]" />
        </CardHeader>
        <CardContent className="flex flex-row items-start justify-between gap-2 p-0">
          <div className="flex flex-col gap-2 p-4 w-full">
            <Skeleton className="w-48 h-[16px] md:h-[18px]" />
            <Skeleton className="w-full h-[12px] md:h-[14px]" />
          </div>
        </CardContent>
      </div>
      <div className="hidden md:flex items-center justify-center bg-muted p-4 border-l">
        <Skeleton className="h-24 aspect-video" />
      </div>
    </Card>
  );
}
