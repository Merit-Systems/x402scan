"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { usePostHog } from "posthog-js/react";
import {
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Minus,
  CircleHelp,
  TriangleAlert,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { DiscoveryActions } from "@/app/(app)/(home)/resources/register/_components/discovery-actions";
import { DiscoveryFixHint } from "@/app/(app)/(home)/resources/register/_components/discovery-fix-hint";
import { RegistrationResult } from "@/app/(app)/(home)/resources/register/_components/registration-result";
import { useDiscovery } from "@/app/(app)/(home)/resources/register/_components/use-discovery";
import { Favicon } from "@/app/(app)/_components/favicon";
import {
  isOpenApiDeclaredFree,
  isRegistrableEndpoint,
} from "@/lib/discovery/catalog-auth";
import { normalizeUrl } from "@/lib/url";
import { resourceKey } from "@/lib/resource-key";
import { api } from "@/trpc/client";
import type { DiscoveredResource } from "@/types/discovery";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";

const CONTACT_EMAIL_PROMPT = `My openapi.json is missing an info.contact.email field. Add it so I can verify ownership of my origin, let users contact me, and customize my merchant pages on Poncho.

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
    type: "parseErrors" | "no402" | "tunnel" | "noDiscovery" | "notInSpec";
    message?: string;
    parseErrors?: string[];
  };
}): string {
  if (result.error.type === "noDiscovery") {
    return (
      result.error.message ??
      "No discovery document found. Add an openapi.json to your origin to register endpoints."
    );
  }

  if (result.error.type === "notInSpec") {
    return (
      result.error.message ??
      "This endpoint is not listed in the origin's openapi.json."
    );
  }

  if (result.error.type === "tunnel") {
    return result.error.message ?? "Tunnel URLs are not supported";
  }

  if (result.error.type === "parseErrors") {
    const parseErrors = result.error.parseErrors ?? [];
    if (parseErrors.length > 0) {
      return `parseResponse: ${parseErrors.join(", ")}`;
    }
    return "parseResponse: Invalid x402 response";
  }

  return "Expected 402 response";
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
  if (!failed) return "Endpoint probe failed";
  if (Array.isArray(failed.parseErrors) && failed.parseErrors.length > 0) {
    return failed.parseErrors[0] ?? failed.error;
  }
  return failed.error || "Endpoint probe failed";
}

export const RegisterResourceForm = () => {
  const [url, setUrl] = useState("");
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
    authModeMap,
    invalidResourcesMap,
    skippedResources,
    freeResourceCount,
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
    ? testedResources.length + freeResourceCount
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

    const registerTarget = async (index: number): Promise<void> => {
      const targetUrl = targets[index];
      if (!targetUrl) return;
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
          await registerTarget(index + 1);
          return;
        }

        failedDetails.push({
          url: targetUrl,
          error: getErrorMessageFromRegisterResult(result),
        });
      } catch (error) {
        failedDetails.push({
          url: targetUrl,
          error: error instanceof Error ? error.message : "Request failed",
        });
      }
      await registerTarget(index + 1);
    };

    await registerTarget(0);

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
      origin: safeGetOrigin(targets[0] ?? ""),
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
        <Field>
          <FieldLabel className="sr-only" htmlFor="server-url">
            Server URL
          </FieldLabel>
          <InputGroup size="xl">
            <InputGroupAddon>https://</InputGroupAddon>
            <InputGroupInput
              id="server-url"
              type="text"
              placeholder="api.example.com"
              value={url.replace(/^https?:\/\//, "")}
              onChange={(event) => {
                const value = event.target.value;
                setHttpWarning(value.startsWith("http://"));
                const raw = value.replace(/^https?:\/\//, "");
                handleUrlChange(`https://${raw}`);
              }}
            />
          </InputGroup>
          {httpWarning && (
            <p className="flex items-center gap-1.5 type-caption text-warning">
              <TriangleAlert className="size-3 shrink-0" />
              x402 requires HTTPS. We&apos;ve upgraded your URL automatically.
            </p>
          )}
        </Field>

        {/* Primary action */}
        {hasDiscoveryResources ? (
          <div className="flex gap-2">
            <Button
              variant="default"
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
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Registering resources...
                </>
              ) : isBatchTestLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
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
                  "This URL only"
                )}
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant="default"
            disabled={
              manualTargets.length === 0 ||
              isLoading ||
              isBatchTestLoading ||
              !isValidUrl ||
              (!discoveryFound && !isDiscoveryLoading) ||
              (!!currentManualFailed && !currentManualTested)
            }
            onClick={() => {
              void handleRegisterManual();
            }}
            className="w-full"
          >
            {isRegisteringManual ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {manualProgress
                  ? `Checking ${manualProgress.current}/${manualProgress.total}`
                  : "Registering..."}
              </>
            ) : manualTargets.length > 1 ? (
              `Register ${manualTargets.length} URLs`
            ) : (
              "Add"
            )}
          </Button>
        )}
      </div>

      {/* Probe result — inline, no separate card. Hidden post-registration. */}
      {!activeBulkResult &&
        url.trim().length > 0 &&
        (() => {
          const strippedDomain = url.replace(/^https?:\/\//, "").trim();
          const hasTld = strippedDomain.includes(".");
          const showInvalidDomain = strippedDomain.length > 0 && !hasTld;

          return (
            <div className="space-y-4">
              {showInvalidDomain && (
                <p className="type-supporting-body text-destructive">
                  Enter a valid domain (e.g. example.com).
                </p>
              )}

              {!showInvalidDomain && isValidUrl && isDiscoveryLoading && (
                <div className="type-supporting-body flex items-center gap-2 py-2 text-muted-foreground">
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
                    discoverySource={discoverySource}
                  />
                )}

              {!showInvalidDomain &&
                isValidUrl &&
                !isDiscoveryLoading &&
                !hasDiscoveryResources &&
                isOriginOnly && (
                  <div className="type-supporting-body space-y-1">
                    <p className="text-destructive">
                      {discoveryError?.includes("TypeError")
                        ? "Couldn't reach this URL."
                        : (discoveryError ??
                          "No discovery document found at this origin.")}
                    </p>
                    {!discoveryError?.includes("TypeError") && (
                      <DiscoveryFixHint noDiscovery />
                    )}
                  </div>
                )}

              {!showInvalidDomain &&
                isValidUrl &&
                !isDiscoveryLoading &&
                !hasDiscoveryResources &&
                !isOriginOnly && (
                  <div className="type-supporting-body space-y-1">
                    <p className="text-destructive">
                      {discoveryError?.includes("TypeError")
                        ? "Couldn't reach this URL."
                        : (discoveryError ??
                          "No discovery document found at this origin.")}
                    </p>
                    {!discoveryError?.includes("TypeError") && (
                      <DiscoveryFixHint noDiscovery />
                    )}
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
          failedResources.every((r) =>
            r.error.includes("v1 response detected")
          );

        return (
          <Collapsible defaultOpen>
            <CollapsibleTrigger render={<Button variant="quiet" size="none" />}>
              <ChevronDown className="size-3" />
              {failedResources.length} endpoint
              {failedResources.length === 1 ? "" : "s"} with errors
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <p className="type-caption text-muted-foreground">
                <strong>
                  {failedResources.length} endpoint
                  {failedResources.length === 1 ? "" : "s"} won&apos;t be
                  registered.
                </strong>{" "}
                {isV1Issue
                  ? "This endpoint returns an x402 v1 response. x402scan only supports v2 — update your paywall to return the v2 format."
                  : 'They need to return a 402 payment challenge — ensure the x402 paywall runs before request validation, or mark the required parameters in your OpenAPI spec so we can probe automatically. If these endpoints are free (not x402-paid), add "security": [] to their OpenAPI definition to exclude them from probing.'}
              </p>
              <div className="max-h-[360px] space-y-2 overflow-y-auto">
                {failedResources.map((failed) => (
                  <FailedResourceRow
                    key={`${resourceKey(failed.url, failed.method)}-${failed.error}`}
                    url={failed.url}
                    error={getPrimaryProbeError(failed)}
                    statusCode={failed.statusCode}
                    issues={failed.issues}
                  />
                ))}
              </div>
              <DiscoveryFixHint
                className="type-label"
                failedResources={failedResources.map((r) => ({
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
          (r) => r.warnings.length > 0
        );
        if (resourcesWithWarnings.length === 0) return null;

        return (
          <Collapsible>
            <CollapsibleTrigger render={<Button variant="quiet" size="none" />}>
              <ChevronDown className="size-3" />
              {resourcesWithWarnings.length} endpoint
              {resourcesWithWarnings.length === 1 ? "" : "s"} with warnings (Not
              blocking)
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <p className="type-caption text-muted-foreground">
                These endpoints will still be registered, but have issues that
                may affect agent compatibility.
              </p>
              <div className="max-h-[360px] space-y-2 overflow-y-auto">
                {resourcesWithWarnings.map((r) => (
                  <div
                    key={resourceKey(r.url, r.method)}
                    className="space-y-1 rounded border bg-muted/50 p-2 type-caption"
                  >
                    <code className="type-compact-code block truncate text-muted-foreground">
                      {toPathLabel(r.url)}
                    </code>
                    {r.warnings.map((w) => (
                      <div
                        key={`${w.code}-${w.message}`}
                        className="text-warning"
                      >
                        {w.message}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <DiscoveryFixHint
                className="type-label"
                warnings={resourcesWithWarnings.flatMap((r) =>
                  r.warnings.map((w) => ({
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

      {/* Skipped endpoints — not registrable, not an error. Openapi-declared
          public (security: []) and apiKey endpoints register as catalog rows,
          so only true leftovers land here. */}
      {!activeBulkResult && skippedResources.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger render={<Button variant="quiet" size="none" />}>
            <ChevronDown className="size-3" />
            {skippedResources.length} unprotected endpoint
            {skippedResources.length === 1 ? "" : "s"} skipped
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            <p className="type-caption text-muted-foreground">
              These endpoints have no x402 paywall and won&apos;t be registered.
              If they should be paid, add x402 payment middleware. If they are
              intentionally free, declare{" "}
              <code className="type-compact-code rounded bg-muted px-1">
                &quot;security&quot;: []
              </code>{" "}
              on them in your OpenAPI spec and they will be registered and shown
              as public endpoints.
            </p>
            <div className="max-h-[200px] space-y-1 overflow-y-auto">
              {skippedResources.map((r) => (
                <code
                  key={`${r.url}-${r.authMode ?? "unknown"}`}
                  className="type-compact-code block rounded bg-muted/50 px-2 py-1 text-muted-foreground"
                >
                  {toPathLabel(r.url)}
                </code>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Bulk result */}
      {activeBulkResult && activeSummaryOrigin ? (
        <RegistrationResult result={activeBulkResult} />
      ) : null}

      {activeBulkResult?.originId && activeSummaryOrigin ? (
        <PostRegistrationDialog
          originId={activeBulkResult.originId}
          origin={activeSummaryOrigin}
          contactEmail={contactEmail}
        />
      ) : null}

      {bulkError && (
        <p className="type-supporting-body text-destructive">{bulkError}</p>
      )}

      {registerMutation.error && (
        <p className="type-supporting-body text-destructive">
          {registerMutation.error.message}
        </p>
      )}
    </div>
  );
};

const CALENDAR_URL =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ1JmDUvMb4QVktX4PscRA66DEAQCLHLJKRKvwFogirtp9JZ0s5l-Vj96Nthl3M16qDPOprzsK6U";

const STEP_NAMES = ["review_api_page", "test_endpoints", "schedule_call"];

function PostRegistrationDialog({
  originId,
  origin,
  contactEmail,
}: {
  originId: string;
  origin: string;
  contactEmail?: string;
}) {
  const [open, setOpen] = useState(true);
  const [clickedSteps, setClickedSteps] = useState<Set<number>>(new Set());
  const [email, setEmail] = useState(contactEmail ?? "");
  const [emailSubmitted, setEmailSubmitted] = useState(!!contactEmail);
  const posthog = usePostHog();
  const dismissMethodRef = useRef<"skip" | "overlay">("overlay");

  const updateEmailMutation = api.public.origins.updateEmail.useMutation({
    onSuccess: () => {
      setEmailSubmitted(true);
      posthog.capture("registration:email_submit", {
        origin_id: originId,
        hostname,
        app_surface: "x402scan",
      });
      window.open(CALENDAR_URL, "_blank");
    },
    onError: () => {
      toast.error("Failed to save email. Please try again.");
    },
  });

  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    hostname = origin;
  }

  useEffect(() => {
    posthog.capture("registration:modal_view", {
      origin_id: originId,
      hostname,
      app_surface: "x402scan",
      has_contact_email: !!contactEmail,
    });
  }, [posthog, originId, hostname, contactEmail]);

  const markClicked = (step: number) => {
    if (!clickedSteps.has(step)) {
      posthog.capture("registration:step_click", {
        origin_id: originId,
        hostname,
        app_surface: "x402scan",
        step_number: step,
        step_name: STEP_NAMES[step - 1],
      });
    }
    setClickedSteps((prev) => new Set(prev).add(step));
  };

  const completedFlags = [
    clickedSteps.has(1),
    clickedSteps.has(2),
    emailSubmitted,
  ];
  const currentStep =
    completedFlags.indexOf(false) + 1 || completedFlags.length + 1;

  return (
    <>
      {!open && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            setOpen(true);
          }}
        >
          Complete your setup &rarr;
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            posthog.capture("registration:modal_close", {
              origin_id: originId,
              hostname,
              app_surface: "x402scan",
              completed_steps: clickedSteps.size,
              dismiss_method: dismissMethodRef.current,
            });
            dismissMethodRef.current = "overlay";
          }
          setOpen(nextOpen);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>You&apos;re registered!</DialogTitle>
            <DialogDescription>Complete your setup.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {/* Step 1 */}
            <ChecklistStep
              number={1}
              completed={clickedSteps.has(1)}
              current={currentStep === 1}
            >
              <Link
                href={`/server/${originId}`}
                target="_blank"
                onClick={() => {
                  markClicked(1);
                }}
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  Review your API page &rarr;
                </Button>
              </Link>
            </ChecklistStep>

            {/* Step 2 */}
            <ChecklistStep
              number={2}
              completed={clickedSteps.has(2)}
              current={currentStep === 2}
            >
              <Link
                href={`https://tryponcho.com/m/${hostname}`}
                target="_blank"
                onClick={() => {
                  markClicked(2);
                }}
                className="flex-1"
              >
                <Button variant="outline" className="w-full">
                  Test your endpoints &rarr;
                </Button>
              </Link>
            </ChecklistStep>

            {/* Step 3 */}
            <ChecklistStep
              number={3}
              label="Get free feedback from our team"
              completed={emailSubmitted}
              current={currentStep === 3}
            >
              {!emailSubmitted ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (email.trim()) {
                      updateEmailMutation.mutate({ originId, email });
                    }
                  }}
                >
                  <Input
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                      updateEmailMutation.isPending
                    }
                  >
                    {updateEmailMutation.isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      "Submit"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="quiet"
                    onClick={() => {
                      dismissMethodRef.current = "skip";
                      setOpen(false);
                    }}
                  >
                    Skip
                  </Button>
                </form>
              ) : (
                contactEmail && (
                  <Link href={CALENDAR_URL} target="_blank" className="flex-1">
                    <Button className="w-full">Schedule a call &rarr;</Button>
                  </Link>
                )
              )}
            </ChecklistStep>

            <div className="-mx-6 -mb-6 border-t px-6 py-4">
              <p className="text-center type-caption text-muted-foreground">
                Share your merchant page:{" "}
                <Link
                  href={`https://tryponcho.com/m/${hostname}`}
                  target="_blank"
                  className="underline"
                >
                  tryponcho.com/m/{hostname}
                </Link>
                <Button
                  type="button"
                  variant="quiet"
                  size="none"
                  aria-label="Copy merchant page link"
                  className="ml-1 align-middle"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `https://tryponcho.com/m/${hostname}`
                    );
                    posthog.capture("registration:link_click", {
                      origin_id: originId,
                      hostname,
                      app_surface: "x402scan",
                      action: "copy_merchant_link",
                    });
                    toast.success("Link copied to clipboard");
                  }}
                >
                  <Copy className="size-3" />
                </Button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ChecklistStep({
  number,
  label,
  completed,
  current,
  children,
}: {
  number: number;
  label?: string;
  completed: boolean;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex ${label ? "items-start" : "items-center"} -mx-3 gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        current
          ? "bg-primary/5 dark:bg-primary/10"
          : completed
            ? ""
            : "opacity-40"
      }`}
    >
      <div
        className={`flex size-6 shrink-0 items-center justify-center rounded-full type-caption transition-colors ${
          completed
            ? "bg-muted text-muted-foreground"
            : current
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {completed ? <Check className="size-3.5" /> : number}
      </div>
      <div className="flex-1 space-y-1.5">
        {label && <p className="type-label">{label}</p>}
        {children}
      </div>
    </div>
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
    <div className="space-y-1 rounded bg-muted/50 p-3 type-caption">
      <div className="flex items-start gap-2">
        <span className="shrink-0 text-muted-foreground">URL:</span>
        <span className="type-compact-code break-all">{pathname}</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="shrink-0 text-muted-foreground">Error:</span>
        <span className="wrap-break-word text-destructive">
          {statusCode && (
            <span className="type-compact-code mr-1">[{statusCode}]</span>
          )}
          {error}
        </span>
      </div>

      {Array.isArray(issues) && issues.length > 0 && (
        <div className="pt-1">
          <p className="mb-1 text-muted-foreground">Validation details:</p>
          <ul className="list-inside list-disc space-y-1">
            {issues.map((issue) => (
              <li
                key={`${issue.code}-${issue.message}`}
                className="type-supporting-body text-destructive"
              >
                {issue.code}: {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const EMPTY_TESTED_RESOURCES: {
  url: string;
  method?: string;
  warnings?: { code: string }[];
}[] = [];
const EMPTY_FAILED_RESOURCES: { url: string; method?: string }[] = [];
const EMPTY_AUTH_MODE_MAP: Record<string, string> = {};
const EMPTY_INVALID_RESOURCES_MAP: Record<
  string,
  { invalid: boolean; reason?: string }
> = {};

function ProbeResult({
  preview,
  urlOrigin,
  resources,
  testedResources = EMPTY_TESTED_RESOURCES,
  failedResources = EMPTY_FAILED_RESOURCES,
  isBatchTestLoading = false,
  authModeMap = EMPTY_AUTH_MODE_MAP,
  invalidResourcesMap = EMPTY_INVALID_RESOURCES_MAP,
  contactEmail,
  discoverySource,
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
  discoverySource?: string;
}) {
  const testedKeys = useMemo(
    () => new Set(testedResources.map(rk)),
    [testedResources]
  );
  const warningKeys = useMemo(
    () =>
      new Set(
        testedResources
          .filter((r) => r.warnings && r.warnings.length > 0)
          .map(rk)
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
          .filter(([, mode]) => mode === "siwx")
          .map(([key]) => key)
      ),
    [authModeMap]
  );
  // Openapi-declared free catalog endpoints (public/apiKey) — registered
  // without probing, like SIWX.
  const publicKeys = useMemo(
    () =>
      new Set(
        Object.entries(authModeMap)
          .filter(
            ([, mode]) =>
              mode === "unprotected" &&
              isOpenApiDeclaredFree(mode, discoverySource)
          )
          .map(([key]) => key)
      ),
    [authModeMap, discoverySource]
  );
  const apiKeyKeys = useMemo(
    () =>
      new Set(
        Object.entries(authModeMap)
          .filter(
            ([, mode]) =>
              mode === "apiKey" && isOpenApiDeclaredFree(mode, discoverySource)
          )
          .map(([key]) => key)
      ),
    [authModeMap, discoverySource]
  );
  const nonPaidKeys = useMemo(() => {
    return new Set(
      resources
        .filter((r) => {
          const mode = authModeMap[rk(r)];
          return (
            mode !== undefined && !isRegistrableEndpoint(mode, discoverySource)
          );
        })
        .map(rk)
    );
  }, [resources, authModeMap, discoverySource]);
  const invalidKeys = useMemo(
    () =>
      new Set(
        Object.entries(invalidResourcesMap)
          .filter(([, info]) => info.invalid)
          .map(([key]) => key)
      ),
    [invalidResourcesMap]
  );
  // Sort: errors → warnings → free (SIWX/public/apiKey) → verified → skipped
  const sortedResources = useMemo(() => {
    const priority = (r: DiscoveredResource) => {
      const k = rk(r);
      if (invalidKeys.has(k) || failedKeys.has(k)) return 0;
      if (warningKeys.has(k)) return 1;
      if (siwxKeys.has(k) || publicKeys.has(k) || apiKeyKeys.has(k)) return 2;
      if (testedKeys.has(k)) return 3;
      return 4; // non-paid — skipped
    };
    return resources.toSorted((a, b) => priority(a) - priority(b));
  }, [
    resources,
    invalidKeys,
    failedKeys,
    warningKeys,
    siwxKeys,
    publicKeys,
    apiKeyKeys,
    testedKeys,
  ]);

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
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        {preview?.favicon ? (
          <Favicon
            url={preview.favicon}
            className="size-8 shrink-0 rounded-md border bg-background"
          />
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={<div className="relative shrink-0 cursor-help" />}
              >
                <Favicon
                  url={null}
                  className="size-8 rounded-md border bg-background"
                />
                <CircleHelp className="absolute -top-1 -right-1 size-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent side="right">
                Add a favicon to help your API stand out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="min-w-0">
          <p className="truncate type-label">
            {preview?.title ?? urlOrigin ?? "Discovered API"}
          </p>
          {preview?.description && (
            <p className="line-clamp-1 type-caption text-muted-foreground">
              {preview.description}
            </p>
          )}
        </div>
      </div>
      {!preview?.favicon && (
        <p className="flex items-center gap-1.5 type-caption text-warning">
          <TriangleAlert className="size-3 shrink-0" />
          Serve a <code className="type-compact-code">/favicon.ico</code> at
          your API root to display an icon.
        </p>
      )}
      {!contactEmail && (
        <div className="space-y-1.5 type-caption text-warning">
          <p className="flex items-start gap-1.5">
            <TriangleAlert className="mt-0.5 size-3 shrink-0" />
            <span>
              Add{" "}
              <code className="type-compact-code rounded bg-muted px-1">
                info.contact.email
              </code>{" "}
              to your openapi.json to verify ownership and let users contact
              you.
            </span>
          </p>
          <p className="pl-[18px] text-foreground">
            <DiscoveryActions
              label="Have your agent add it with this prompt"
              customPrompt={CONTACT_EMAIL_PROMPT}
            />{" "}
            or{" "}
            <Link
              href="/discovery#merchant-dashboard"
              className="underline underline-offset-2 transition-colors hover:text-foreground"
            >
              learn more
            </Link>
          </p>
        </div>
      )}
      {isBatchTestLoading ? (
        <div className="flex items-center gap-2 py-1 type-caption text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          Verifying {resources.length} endpoints...
        </div>
      ) : (
        <Button
          variant="plain"
          size="none"
          onClick={() => {
            setExpanded(!expanded);
          }}
          className="w-full text-left"
        >
          <ul className="w-full space-y-0.5 text-muted-foreground">
            {previewResources.map((resource) => {
              const k = rk(resource);
              return (
                <li key={k} className="flex items-center gap-1.5 truncate">
                  {nonPaidKeys.has(k) ? (
                    <Minus className="size-3 shrink-0 text-muted-foreground/40" />
                  ) : invalidKeys.has(k) ? (
                    <X className="size-3 shrink-0 text-destructive" />
                  ) : siwxKeys.has(k) ? (
                    <Check className="size-3 shrink-0 text-primary" />
                  ) : publicKeys.has(k) ? (
                    <Check className="size-3 shrink-0 text-information" />
                  ) : apiKeyKeys.has(k) ? (
                    <Check className="size-3 shrink-0 text-muted-foreground" />
                  ) : warningKeys.has(k) ? (
                    <TriangleAlert className="size-3 shrink-0 text-warning" />
                  ) : testedKeys.has(k) ? (
                    <Check className="size-3 shrink-0 text-success" />
                  ) : failedKeys.has(k) ? (
                    <X className="size-3 shrink-0 text-destructive" />
                  ) : null}
                  <code className="type-compact-code">
                    <span
                      className={
                        nonPaidKeys.has(k)
                          ? "text-muted-foreground/40 line-through"
                          : undefined
                      }
                    >
                      {showMethodBadges && resource.method && (
                        <span className="mr-1 type-label text-muted-foreground/70">
                          {resource.method}
                        </span>
                      )}
                      {toPathLabel(resource.url)}
                    </span>
                  </code>
                </li>
              );
            })}
            {!expanded && hiddenCount > 0 && (
              <li className="text-muted-foreground/60 transition-colors hover:text-muted-foreground">
                + {hiddenCount} more
              </li>
            )}
            {expanded && sortedResources.length > 8 && (
              <li className="text-muted-foreground/60 transition-colors hover:text-muted-foreground">
                show less
              </li>
            )}
          </ul>
        </Button>
      )}
    </div>
  );
}
