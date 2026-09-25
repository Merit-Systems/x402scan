"use client";

import { CircleAlert, CircleCheck, ChevronDown, X } from "lucide-react";

import { DiscoveryFixHint } from "@/app/(app)/(home)/resources/register/_components/discovery-fix-hint";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface RegistrationResult {
  registered: number;
  siwx?: number;
  publicCount?: number;
  apiKeyCount?: number;
  total: number;
  failed: number;
  skipped?: number;
  deprecated?: number;
  failedDetails?: { url: string; error: string; status?: number }[];
  skippedDetails?: { url: string; error: string; status?: number }[];
  warningDetails?: {
    url: string;
    warnings: { code: string; severity: string; message: string }[];
  }[];
  originId?: string;
}

function getPath(resourceUrl: string) {
  try {
    return decodeURIComponent(new URL(resourceUrl).pathname);
  } catch {
    return resourceUrl;
  }
}

function ResultDisclosure({
  children,
  label,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  label: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger render={<Button variant="quiet" size="none" />}>
        <ChevronDown className="size-3 transition-transform in-data-[panel-open]:rotate-180" />
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ResourceIssue({
  error,
  status,
  url,
}: {
  error: string;
  status?: number;
  url: string;
}) {
  return (
    <div className="space-y-1 rounded-lg bg-muted/50 p-3 type-caption">
      <div>
        <code className="type-compact-code break-all text-foreground">
          {getPath(url)}
        </code>
      </div>
      <p className="wrap-break-word text-destructive">{error}</p>
      {status ? (
        <div>
          <code className="type-compact-code text-muted-foreground">
            HTTP {status}
          </code>
        </div>
      ) : null}
    </div>
  );
}

export function RegistrationResult({ result }: { result: RegistrationResult }) {
  const freeCount =
    (result.siwx ?? 0) + (result.publicCount ?? 0) + (result.apiKeyCount ?? 0);
  const registeredCount = result.registered + freeCount;
  const failedDetails = result.failedDetails ?? [];
  const skippedDetails = result.skippedDetails ?? [];

  if (registeredCount === 0 && result.failed > 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-lg border border-destructive-border bg-destructive-subtle p-4 text-destructive">
          <X className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="type-card-title">Registration failed</h2>
            <p className="type-supporting-body text-muted-foreground">
              Failed to register all {failedDetails.length || result.failed}{" "}
              resources.
            </p>
            <DiscoveryFixHint
              className="mt-1"
              failedResources={failedDetails}
            />
          </div>
        </div>

        <ResultDisclosure
          label={`${String(failedDetails.length || result.failed)} failed resources`}
          defaultOpen
        >
          {failedDetails.length > 0 ? (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {failedDetails.map((failure) => (
                <ResourceIssue
                  key={`${failure.url}-${failure.error}`}
                  url={failure.url}
                  error={failure.error}
                  status={failure.status}
                />
              ))}
            </div>
          ) : (
            <p className="type-supporting-body text-muted-foreground">
              No detailed error information is available.
            </p>
          )}
        </ResultDisclosure>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-lg border border-success-border bg-success-subtle p-4 text-success">
        <CircleCheck className="size-5 shrink-0" />
        <p className="type-label">
          Successfully registered {registeredCount} of{" "}
          {registeredCount + failedDetails.length} resources
          {failedDetails.length > 0 ? (
            <span className="text-destructive">
              {" "}
              ({failedDetails.length} not registered)
            </span>
          ) : null}
        </p>
      </div>

      {result.deprecated ? (
        <div className="flex items-start gap-3 rounded-lg border border-warning-border bg-warning-subtle p-4 text-warning">
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3 className="type-card-title">
              {result.deprecated} resource
              {result.deprecated === 1 ? "" : "s"} deprecated
            </h3>
            <p className="type-supporting-body text-muted-foreground">
              Resources no longer present in the discovery document were removed
              from listings. Their historical data is preserved.
            </p>
          </div>
        </div>
      ) : null}

      {result.warningDetails?.length ? (
        <ResultDisclosure
          label={`${String(result.warningDetails.length)} registered resource${result.warningDetails.length === 1 ? "" : "s"} with warnings`}
        >
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {result.warningDetails.map((entry) => (
              <div
                key={entry.url}
                className="space-y-1 rounded-lg bg-warning-subtle p-3 type-caption"
              >
                <div>
                  <code className="type-compact-code break-all text-foreground">
                    {getPath(entry.url)}
                  </code>
                </div>
                {entry.warnings.map((warning) => (
                  <p key={`${warning.code}-${warning.message}`}>
                    {warning.message}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <DiscoveryFixHint
            warnings={result.warningDetails.flatMap((entry) =>
              entry.warnings.map((warning) => ({
                url: entry.url,
                error: warning.message,
              }))
            )}
          />
        </ResultDisclosure>
      ) : null}

      {skippedDetails.length > 0 ? (
        <ResultDisclosure
          label={`${String(skippedDetails.length)} unprotected endpoint${skippedDetails.length === 1 ? "" : "s"} skipped`}
        >
          <p className="type-caption text-muted-foreground">
            These endpoints have no x402 paywall and were not registered. Add
            x402 payment middleware for paid routes, or declare{" "}
            <code className="type-compact-code rounded bg-muted px-1">
              &quot;security&quot;: []
            </code>{" "}
            for intentionally free routes.
          </p>
          <div className="max-h-52 space-y-1 overflow-y-auto">
            {skippedDetails.map((skipped) => (
              <div
                key={`${skipped.url}-${skipped.error}`}
                className="space-y-0.5 rounded-lg bg-muted/50 px-3 py-2 type-caption text-muted-foreground"
              >
                <div>
                  <code className="type-compact-code text-foreground">
                    {getPath(skipped.url)}
                  </code>
                </div>
                <p>{skipped.error}</p>
              </div>
            ))}
          </div>
        </ResultDisclosure>
      ) : null}

      {failedDetails.length > 0 ? (
        <ResultDisclosure
          label={`${String(failedDetails.length)} resource${failedDetails.length === 1 ? "" : "s"} not registered`}
          defaultOpen
        >
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {failedDetails.map((failure) => (
              <ResourceIssue
                key={`${failure.url}-${failure.error}`}
                url={failure.url}
                error={failure.error}
                status={failure.status}
              />
            ))}
          </div>
          <DiscoveryFixHint failedResources={failedDetails} />
        </ResultDisclosure>
      ) : null}
    </div>
  );
}
