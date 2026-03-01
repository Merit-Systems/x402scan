'use client';

import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { Favicon } from '@/app/(app)/_components/favicon';
import { ResourceExecutor } from '@/app/(app)/_components/resources/executor';
import {
  createDummyOgImage,
  createDummyResourceOrigin,
  createDummyResources,
} from '@/app/(app)/developer/_components/dummy';

import { getOutputSchema } from '@/lib/x402';
import type {
  FailedResource as FailedResourceType,
  TestedResource as TestedResourceType,
} from '@/types/batch-test';
import type { DiscoverySource } from '@/types/discovery';
import type { Methods } from '@/types/x402';
import type { OgImage, ResourceOrigin } from '@x402scan/scan-db/types';

import { api } from '@/trpc/client';

type TestedResource = TestedResourceType;
type FailedResource = FailedResourceType;

export interface OriginPreview {
  title: string | null;
  description: string | null;
  favicon: string | null;
  ogImages: { url: string; height?: number; width?: number }[];
  origin: string;
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
  /** Discovery source from discovery runtime */
  source?: DiscoverySource;
  /** List of discovered resource URLs */
  resources: string[];
  /** Total count of resources */
  resourceCount: number;
  /** Error message when discovery failed */
  discoveryError?: string;
  /** Map of URL to invalid status for displaying badges */
  invalidResourcesMap?: Record<string, { invalid: boolean; reason?: string }>;
  /** Whether bulk registration is in progress */
  isRegisteringAll: boolean;
  /** Bulk registration result */
  bulkResult?: {
    success: boolean;
    registered: number;
    total: number;
    failed: number;
    skipped?: number;
    deprecated?: number;
    failedDetails?: { url: string; error: string; status?: number }[];
    skippedDetails?: { url: string; error: string; status?: number }[];
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
  /** Called when retry is clicked for a single resource */
  onRetryResource?: (url: string) => Promise<void>;
  /** URLs that are already registered */
  registeredUrls?: string[];
  /** Ownership proofs from discovery document */
  ownershipProofs?: string[];
  /** PayTo addresses from tested resources */
  payToAddresses?: string[];
  /** Addresses recovered from ownership proof signatures */
  recoveredAddresses?: string[];
  /** Map of payTo address to verification status */
  verifiedAddresses?: Record<string, boolean>;
  /** Whether overall ownership is verified */
  ownershipVerified?: boolean;
}

const ITEMS_PER_PAGE = 5;

export function DiscoveryPanel({
  origin,
  enteredUrl,
  isLoading,
  found,
  source,
  resources,
  resourceCount,
  discoveryError,
  invalidResourcesMap = {},
  isRegisteringAll,
  bulkResult,
  onRegisterAll,
  showRegisterButton = true,
  mode = 'register',
  preview,
  isPreviewLoading = false,
  testedResources = [],
  failedResources = [],
  isBatchTestLoading,
  onRefresh,
  onRetryResource,
  registeredUrls = [],
  ownershipProofs = [],
  payToAddresses = [],
  recoveredAddresses = [],
  verifiedAddresses = {},
}: DiscoveryPanelProps) {
  const [page, setPage] = useState(0);

  // Don't render anything if no origin
  if (!origin) return null;

  const isTestMode = mode === 'test';

  // Show bulk registration result (only in register mode)
  if (!isTestMode && bulkResult?.success) {
    const skippedCount = bulkResult.skipped ?? 0;

    // Show error state if no resources were registered
    if (bulkResult.registered === 0 && bulkResult.failed > 0) {
      return (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 border rounded-md bg-red-500/10 border-red-500/30">
            <XCircle className="size-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold text-red-600">
                Registration Failed
              </h2>
              <p className="text-sm text-muted-foreground">
                Failed to register all {bulkResult.total} resources
              </p>
            </div>
          </div>

          <details className="border rounded-md group">
            <summary className="p-3 cursor-pointer hover:bg-muted/50 font-medium text-sm flex items-center gap-2">
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              More Info ({bulkResult.failedDetails?.length ?? bulkResult.failed}{' '}
              failed resources)
            </summary>
            <div className="p-4 pt-2 border-t space-y-2 max-h-[400px] overflow-y-auto">
              {bulkResult.failedDetails &&
              bulkResult.failedDetails.length > 0 ? (
                bulkResult.failedDetails.map((failed, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-muted/50 rounded border text-xs space-y-1"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">
                        URL:
                      </span>
                      <span className="font-mono break-all">{failed.url}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">
                        Error:
                      </span>
                      <span className="text-red-600 wrap-break-word">
                        {failed.error}
                      </span>
                    </div>
                    {failed.status && (
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground shrink-0">
                          Status:
                        </span>
                        <span className="font-mono">{failed.status}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No detailed error information available. Check the console for
                  more details.
                </div>
              )}
            </div>
          </details>
        </div>
      );
    }

    // Show success state if some/all resources were registered
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 border rounded-md bg-green-600/10 border-green-600/30">
          <CheckCircle className="size-6 text-green-600" />
          <div>
            <h2 className="font-semibold">Registration Complete</h2>
            <p className="text-sm text-muted-foreground">
              Successfully registered {bulkResult.registered} of{' '}
              {bulkResult.total} resources
              {skippedCount > 0 && (
                <span className="text-amber-700"> ({skippedCount} skipped)</span>
              )}
              {bulkResult.failed > 0 && (
                <span className="text-red-600">
                  {' '}
                  ({bulkResult.failed} failed)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Skipped resources notice */}
        {skippedCount > 0 && (
          <div className="flex items-start gap-3 p-4 border rounded-md bg-amber-600/10 border-amber-600/30">
            <AlertCircle className="size-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">
                {skippedCount} resource{skippedCount === 1 ? '' : 's'} skipped
              </h3>
              <p className="text-sm text-muted-foreground">
                Auth-only SIWX endpoints without payment requirements were
                skipped in legacy indexing mode.
              </p>
            </div>
          </div>
        )}

        {/* Deprecation notice */}
        {bulkResult.deprecated !== undefined && bulkResult.deprecated > 0 && (
          <div className="flex items-start gap-3 p-4 border rounded-md bg-yellow-600/10 border-yellow-600/30">
            <AlertCircle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-700">
                {bulkResult.deprecated} resource
                {bulkResult.deprecated === 1 ? '' : 's'} deprecated
              </h3>
              <p className="text-sm text-muted-foreground">
                Resources previously registered for this origin that are no
                longer in your discovery document have been marked as
                deprecated. They won&apos;t appear in listings but historical
                data is preserved.
              </p>
            </div>
          </div>
        )}

        {bulkResult.failed > 0 &&
          bulkResult.failedDetails &&
          bulkResult.failedDetails.length > 0 && (
            <details className="border rounded-md group">
              <summary className="p-3 cursor-pointer hover:bg-muted/50 font-medium text-sm flex items-center gap-2">
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                More Info ({bulkResult.failedDetails.length} failed resources)
              </summary>
              <div className="p-4 pt-2 border-t space-y-2 max-h-[400px] overflow-y-auto">
                {bulkResult.failedDetails.map((failed, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-muted/50 rounded border text-xs space-y-1"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">
                        URL:
                      </span>
                      <span className="font-mono break-all">{failed.url}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">
                        Error:
                      </span>
                      <span className="text-red-600 wrap-break-word">
                        {failed.error}
                      </span>
                    </div>
                    {failed.status && (
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground shrink-0">
                          Status:
                        </span>
                        <span className="font-mono">{failed.status}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}

        {skippedCount > 0 &&
          bulkResult.skippedDetails &&
          bulkResult.skippedDetails.length > 0 && (
            <details className="border rounded-md group">
              <summary className="p-3 cursor-pointer hover:bg-muted/50 font-medium text-sm flex items-center gap-2">
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                Skipped Details ({bulkResult.skippedDetails.length} resources)
              </summary>
              <div className="p-4 pt-2 border-t space-y-2 max-h-[400px] overflow-y-auto">
                {bulkResult.skippedDetails.map((skipped, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-muted/50 rounded border text-xs space-y-1"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">
                        URL:
                      </span>
                      <span className="font-mono break-all">{skipped.url}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground shrink-0">
                        Reason:
                      </span>
                      <span className="text-amber-700 wrap-break-word">
                        {skipped.error}
                      </span>
                    </div>
                    {skipped.status && (
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground shrink-0">
                          Status:
                        </span>
                        <span className="font-mono">{skipped.status}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
      </div>
    );
  }

  // Show "not found" or "invalid" message if discovery was checked but nothing found
  // Only show in test mode (developer page), not on register page
  if (isTestMode && !isLoading && resourceCount === 0 && !found) {
    // Check if document was found but invalid (vs not found at all)
    const isInvalidDocument = discoveryError?.includes(
      'Invalid discovery document'
    );

    const icon = isInvalidDocument ? (
      <ShieldAlert className="size-4 text-red-600 shrink-0" />
    ) : (
      <XCircle className="size-4 text-muted-foreground shrink-0" />
    );

    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 p-3 border rounded-md',
          isInvalidDocument ? 'bg-red-600/10 border-red-600/30' : 'bg-muted/30'
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon}
          <span className="text-sm text-muted-foreground">
            {isInvalidDocument ? (
              <>
                Found{' '}
                <code className="px-1 py-0.5 bg-muted rounded text-xs">
                  /.well-known/x402
                </code>{' '}
                but invalid: {discoveryError}
              </>
            ) : (
              <>
                No{' '}
                <code className="px-1 py-0.5 bg-muted rounded text-xs">
                  /.well-known/x402
                </code>{' '}
                found
              </>
            )}
          </span>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="gap-1 shrink-0"
          >
            <RefreshCw className="size-3" />
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Don't render anything if no resources to show
  if (resourceCount === 0) {
    return null;
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
    <div className="flex flex-col">
      {/* Resources display - shows when we have resources (discovery or direct test) */}
      {!isLoading && resourceCount > 0 && (
        <div className="flex flex-col">
          {/* Origin Card */}
          {isPreviewLoading ? (
            <LoadingOriginCard />
          ) : (
            <OriginPreviewCard
              origin={originData}
              resourceCount={resourceCount}
              ownershipProofs={ownershipProofs}
              payToAddresses={payToAddresses}
              recoveredAddresses={recoveredAddresses}
              verifiedAddresses={verifiedAddresses}
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
                  const invalidInfo = invalidResourcesMap[resourceUrl];

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
                          invalidInfo={invalidInfo}
                          verifiedAddresses={verifiedAddresses}
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
                        invalidInfo={invalidInfo}
                        verifiedAddresses={verifiedAddresses}
                        onRetry={onRetryResource}
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
                      invalidInfo={invalidInfo}
                      verifiedAddresses={verifiedAddresses}
                      onRetry={onRetryResource}
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
              invalidResourcesMap={invalidResourcesMap}
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

/**
 * Compute verification status for a specific resource based on its payTo addresses
 */
function getResourceVerificationStatus(
  parsed: TestedResource['parsed'],
  verifiedAddresses: Record<string, boolean>
): { verified: boolean; partial: boolean; addresses: string[] } {
  const addresses: string[] = [];

  // Extract all payTo addresses from accepts
  if (parsed.accepts) {
    for (const accept of parsed.accepts) {
      if ('payTo' in accept && typeof accept.payTo === 'string') {
        addresses.push(accept.payTo);
      }
    }
  }

  if (addresses.length === 0) {
    return { verified: false, partial: false, addresses: [] };
  }

  const verifiedCount = addresses.filter(
    addr => verifiedAddresses[addr] === true
  ).length;

  return {
    verified: verifiedCount === addresses.length && addresses.length > 0,
    partial: verifiedCount > 0 && verifiedCount < addresses.length,
    addresses,
  };
}

/** Wrapper for ResourceExecutor */
function DiscoveredResourceExecutor({
  resourceUrl,
  tested,
  idx,
  preview,
  invalidInfo,
  verifiedAddresses = {},
}: {
  resourceUrl: string;
  tested: TestedResource;
  idx: number;
  preview?: OriginPreview | null;
  invalidInfo?: { invalid: boolean; reason?: string };
  verifiedAddresses?: Record<string, boolean>;
}) {
  const outputSchema = getOutputSchema(tested.parsed);
  const method =
    (outputSchema?.input?.method?.toUpperCase() as Methods) ??
    (tested.method as Methods);

  const verificationStatus = getResourceVerificationStatus(
    tested.parsed,
    verifiedAddresses
  );

  // Collect warnings for missing optional items
  const warnings: string[] = [];
  if (!outputSchema?.output) warnings.push('Output schema');
  if (!preview?.ogImages?.[0]?.url) warnings.push('OG image');
  if (!preview?.favicon) warnings.push('Favicon');
  if (invalidInfo?.invalid)
    warnings.push(`Invalid: ${invalidInfo.reason ?? 'Unknown format error'}`);

  // Add verification warnings only for unverified resources
  if (verificationStatus.addresses.length > 0 && !verificationStatus.verified) {
    const verifiedList = verificationStatus.addresses.filter(
      addr => verifiedAddresses[addr] === true
    );
    const unverifiedAddresses = verificationStatus.addresses.filter(
      addr => verifiedAddresses[addr] !== true
    );

    if (verificationStatus.partial) {
      // Show both verified and unverified for partial verification
      const verifiedShort = verifiedList
        .map(addr => `${addr.slice(0, 6)}...${addr.slice(-4)}`)
        .join(', ');
      const unverifiedShort = unverifiedAddresses
        .map(addr => `${addr.slice(0, 6)}...${addr.slice(-4)}`)
        .join(', ');

      warnings.push(
        `${verifiedList.length} of ${verificationStatus.addresses.length} addresses verified. ` +
          `Verified: ${verifiedShort}. Unverified: ${unverifiedShort}`
      );
    } else {
      // Show only unverified for fully unverified
      const addressList = unverifiedAddresses
        .map(addr => `${addr.slice(0, 6)}...${addr.slice(-4)}`)
        .join(', ');
      warnings.push(`No ownership proof for payTo address: ${addressList}`);
    }
  }

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
      ownershipVerified={verificationStatus.verified}
    />
  );
}

/** Card for failed resources showing validation checklist */
function FailedResourceCard({
  resourceUrl,
  preview,
  failedDetails,
  testedResponse,
  invalidInfo,
  verifiedAddresses = {},
  onRetry,
}: {
  resourceUrl: string;
  preview?: OriginPreview | null;
  failedDetails?: FailedResource;
  /** If provided, x402 parsed successfully but is missing schema */
  testedResponse?: TestedResource;
  invalidInfo?: { invalid: boolean; reason?: string };
  verifiedAddresses?: Record<string, boolean>;
  onRetry?: (url: string) => Promise<void>;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

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
  const outputSchema = testedResponse
    ? getOutputSchema(testedResponse.parsed)
    : null;
  const hasInputSchema = Boolean(outputSchema?.input);
  const hasOutputSchema = Boolean(outputSchema?.output);

  // Compute per-resource verification status
  const verificationStatus = testedResponse
    ? getResourceVerificationStatus(testedResponse.parsed, verifiedAddresses)
    : { verified: false, partial: false, addresses: [] };
  const resourceOwnershipVerified = verificationStatus.verified;

  // Determine checklist status based on error details or tested response
  const returns402 = x402Parsed || failedDetails?.status === 402;
  const isInvalid = invalidInfo?.invalid ?? false;
  const errorMessage = isInvalid
    ? (invalidInfo?.reason ?? 'Invalid format')
    : x402Parsed
      ? 'Missing input schema'
      : (failedDetails?.error ?? 'Unknown error');

  return (
    <div className="pl-4 border-l pt-4 relative">
      <div className="absolute left-0 top-[calc(2rem+5px)] w-4 h-px bg-border" />
      <Card
        className={cn(
          'overflow-hidden',
          isInvalid ? 'border-yellow-500/30' : 'border-red-500/30'
        )}
      >
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-left"
        >
          <CardHeader className="bg-muted px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={cn(
                    'font-mono px-1 rounded-md text-xs shrink-0',
                    isInvalid
                      ? 'bg-yellow-600/10 border border-yellow-600 text-yellow-600'
                      : 'bg-red-600/10 border border-red-600 text-red-600'
                  )}
                >
                  {isInvalid ? 'INVALID' : 'ERR'}
                </div>
                <span className="font-mono text-sm truncate">{pathname}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    'text-xs truncate max-w-[200px]',
                    isInvalid ? 'text-yellow-500' : 'text-red-500'
                  )}
                >
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
                { label: 'Ownership verified', ok: resourceOwnershipVerified },
                { label: 'OG image', ok: Boolean(preview?.ogImages?.[0]?.url) },
                { label: 'Favicon', ok: Boolean(preview?.favicon) },
              ]}
            />

            {/* Try Again Button */}
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRetrying(true);
                  void onRetry(resourceUrl).finally(() => {
                    setIsRetrying(false);
                  });
                }}
                disabled={isRetrying}
                className="gap-1 w-full"
              >
                <RefreshCw
                  className={cn('size-3', isRetrying && 'animate-spin')}
                />
                Try Again
              </Button>
            )}

            {/* HTTP Response Details */}
            {failedDetails && (
              <div className="border rounded-md bg-muted/30 p-3 text-xs space-y-2">
                <p className="font-medium">HTTP Response</p>
                <div className="space-y-1">
                  {failedDetails.status && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-mono">
                        {failedDetails.status} {failedDetails.statusText}
                      </span>
                    </div>
                  )}
                  {(() => {
                    const methods = failedDetails.triedMethods;
                    return (
                      Array.isArray(methods) &&
                      methods.length > 0 && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground">
                            Tried Methods:
                          </span>
                          <span className="font-mono">
                            {methods.join(', ')}
                          </span>
                        </div>
                      )
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Parse Errors */}
            {(() => {
              const errors = failedDetails?.parseErrors;
              return (
                Array.isArray(errors) &&
                errors.length > 0 && (
                  <div className="border rounded-md bg-red-500/5 border-red-500/30 p-3 text-xs space-y-2">
                    <p className="font-medium text-red-600">
                      Validation Errors
                    </p>
                    <ul className="space-y-1 list-disc list-inside">
                      {errors.map((error: string, i: number) => (
                        <li
                          key={i}
                          className="text-red-600 font-mono text-[10px]"
                        >
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              );
            })()}

            {/* Headers - collapsible */}
            {(() => {
              const headers = failedDetails?.headers;
              return (
                headers &&
                typeof headers === 'object' &&
                Object.keys(headers).length > 0 && (
                  <details className="border rounded-md bg-muted/30">
                    <summary className="p-2 text-xs font-medium cursor-pointer hover:bg-muted/50">
                      HTTP Headers ({Object.keys(headers).length})
                    </summary>
                    <div className="p-2 pt-0 space-y-1">
                      {Object.entries(headers).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex gap-2 text-[10px] font-mono"
                        >
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="break-all">{value}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )
              );
            })()}

            {/* Raw response - nested collapsible */}
            {(failedDetails?.body !== undefined || testedResponse?.parsed) && (
              <div className="border rounded-md bg-muted/30">
                <button
                  type="button"
                  onClick={() => setShowRawResponse(!showRawResponse)}
                  className="w-full flex items-center justify-between p-2 text-left"
                >
                  <span className="text-xs font-medium">Raw Response Body</span>
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
  invalidResourcesMap = {},
}: {
  enteredUrl?: string;
  discoveredResources: string[];
  source?: DiscoverySource;
  registeredUrls: string[];
  invalidResourcesMap?: Record<string, { invalid: boolean; reason?: string }>;
}) {
  const registeredSet = new Set(registeredUrls);

  // Build unified list: entered URL first (if exists), then discovered
  const allResources: {
    url: string;
    source: 'entered' | DiscoverySource;
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

  return (
    <div className="border rounded-md overflow-hidden mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted text-muted-foreground text-xs">
            <th className="text-left px-3 py-2 font-medium">Resource</th>
            <th className="text-left px-3 py-2 font-medium">Source</th>
            <th className="text-left px-3 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {allResources.map(({ url, source: resourceSource, isRegistered }) => {
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
                      : resourceSource === 'openapi'
                        ? 'OpenAPI'
                        : resourceSource === 'dns'
                          ? '_x402 DNS TXT'
                          : resourceSource === 'probe'
                            ? 'Runtime Probe'
                            : resourceSource === 'interop-mpp'
                              ? '/.well-known/mpp'
                              : '/.well-known/x402'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {isRegistered ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="size-3" />
                        Already Registered
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">New</span>
                    )}
                    {invalidResourcesMap[url]?.invalid && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-yellow-600/10 border border-yellow-600 text-yellow-600">
                            <AlertCircle className="size-3" />
                            INVALID
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {invalidResourcesMap[url]?.reason ??
                              'Invalid format'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
  ownershipProofs = [],
  payToAddresses = [],
  recoveredAddresses = [],
  verifiedAddresses = {},
}: {
  origin: ResourceOrigin & { ogImages: OgImage[] };
  resourceCount: number;
  ownershipProofs?: string[];
  payToAddresses?: string[];
  recoveredAddresses?: string[];
  verifiedAddresses?: Record<string, boolean>;
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

  const hasProofs = ownershipProofs.length > 0;
  const hasPayTo = payToAddresses.length > 0;

  const truncateAddress = (a: string) => `${a.slice(0, 6)}...${a.slice(-4)}`;

  // Check if this is a real origin (has a valid UUID) vs discovered preview
  const isRealOrigin =
    origin.id !== 'discovered' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      origin.id
    );

  // Query database verification status for real origins
  const { data: dbVerificationStatus } =
    api.public.resources.verificationStatus.useQuery(
      { originId: origin.id },
      { enabled: isRealOrigin }
    );

  // Determine verification state
  const getVerificationState = () => {
    // Use database verification if available (for registered origins)
    if (
      isRealOrigin &&
      dbVerificationStatus &&
      !Array.isArray(dbVerificationStatus)
    ) {
      const { verified, total, allVerified, partiallyVerified } =
        dbVerificationStatus;

      if (allVerified) {
        return {
          status: 'verified' as const,
          badge: (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-600/10 border border-green-600/30 rounded-full px-2 py-0.5">
              <ShieldCheck className="size-3" />
              Verified
            </span>
          ),
        };
      }

      if (partiallyVerified) {
        return {
          status: 'partial' as const,
          badge: (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 bg-yellow-600/10 border border-yellow-600/30 rounded-full px-2 py-0.5 cursor-help">
                  <ShieldAlert className="size-3" />
                  Partially Verified ({verified}/{total})
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-72">
                <p className="font-medium">
                  Only some payment addresses are verified
                </p>
                <p className="text-muted-foreground">
                  {verified} out of {total} payment addresses have verified
                  ownership proofs.
                </p>
              </TooltipContent>
            </Tooltip>
          ),
        };
      }

      // Unverified
      return {
        status: 'unverified' as const,
        badge: (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary border border-border rounded-full px-2 py-0.5 cursor-help">
                <ShieldAlert className="size-3" />
                Unverified
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-72">
              <p className="font-medium">No verified ownership proofs</p>
              <p className="text-muted-foreground">
                Add ownership proofs to your discovery document to verify
                control of payment addresses.
              </p>
            </TooltipContent>
          </Tooltip>
        ),
      };
    }

    // Fall back to runtime ownership verification for discovered (not yet registered) origins
    // Count verified addresses from the verifiedAddresses map
    const verifiedCount = Object.values(verifiedAddresses).filter(
      v => v
    ).length;
    const totalAddresses = Object.keys(verifiedAddresses).length;
    const allVerified = totalAddresses > 0 && verifiedCount === totalAddresses;
    const partiallyVerified =
      verifiedCount > 0 && verifiedCount < totalAddresses;

    // Show fully verified if all addresses are verified
    if (allVerified) {
      return {
        status: 'verified' as const,
        badge: (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-600/10 border border-green-600/30 rounded-full px-2 py-0.5">
            <ShieldCheck className="size-3" />
            Verified
          </span>
        ),
      };
    }

    // Show partially verified if some addresses are verified
    if (partiallyVerified) {
      // Get verified and unverified addresses for tooltip
      const verifiedList = payToAddresses.filter(
        addr => verifiedAddresses[addr]
      );
      const unverifiedList = payToAddresses.filter(
        addr => !verifiedAddresses[addr]
      );

      return {
        status: 'partial' as const,
        badge: (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary border border-border rounded-full px-2 py-0.5 cursor-help">
                <ShieldAlert className="size-3" />
                Partially Verified ({verifiedCount}/{totalAddresses})
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-96">
              <p className="font-medium">
                Only some payment addresses are verified
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {verifiedCount} out of {totalAddresses} payment addresses have
                verified ownership proofs.
              </p>
              {verifiedList.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-green-600">
                    Verified:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {verifiedList.map(addr => (
                      <li key={addr}>{truncateAddress(addr)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {unverifiedList.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-red-600">
                    Unverified:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {unverifiedList.map(addr => (
                      <li key={addr}>{truncateAddress(addr)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {recoveredAddresses.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium">Proven addresses:</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {recoveredAddresses.map(addr => (
                      <li key={addr}>{truncateAddress(addr)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        ),
      };
    }

    // Unverified - determine why
    const getUnverifiedReason = () => {
      if (!hasProofs) {
        return {
          title: 'Missing ownership proof',
          description:
            'Ownership proofs verify you control the payTo address. Sign your origin URL with your payTo private key and add it to the ownershipProofs array in your discovery document.',
        };
      }
      if (!hasPayTo) {
        return {
          title: 'No payTo addresses found',
          description:
            'Could not extract payTo addresses from resource accepts to verify against.',
        };
      }
      // Has proofs and payTo but still unverified = mismatch
      const recoveredStr =
        recoveredAddresses.length > 0
          ? recoveredAddresses.map(truncateAddress).join(', ')
          : 'unknown';
      const expectedStr = payToAddresses.map(truncateAddress).join(', ');
      return {
        title: 'Proof mismatch',
        description: `Recovered: ${recoveredStr}. Expected: ${expectedStr}`,
      };
    };

    const unverifiedReason = getUnverifiedReason();

    return {
      status: 'unverified' as const,
      badge: (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary border border-border rounded-full px-2 py-0.5 cursor-help">
              <ShieldAlert className="size-3" />
              Unverified
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-96">
            <p className="font-medium">{unverifiedReason.title}</p>
            <p className="text-muted-foreground text-xs">
              {unverifiedReason.description}
            </p>
            {recoveredAddresses.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium">Proven addresses:</p>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {recoveredAddresses.map(addr => (
                    <li key={addr}>{truncateAddress(addr)}</li>
                  ))}
                </ul>
              </div>
            )}
            {payToAddresses.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-red-600">Unverified:</p>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {payToAddresses.map(addr => (
                    <li key={addr}>{truncateAddress(addr)}</li>
                  ))}
                </ul>
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      ),
    };
  };

  const verificationState = getVerificationState();

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
          <CardTitle className="font-bold text-base md:text-lg flex items-center gap-2">
            {hostname}
            {verificationState.badge}
            <span className="text-muted-foreground text-xs md:text-sm font-normal">
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
