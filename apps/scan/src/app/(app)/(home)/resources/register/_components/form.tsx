'use client';

import { useMemo, useState } from 'react';

import type { ChangeEvent } from 'react';

import {
  ArrowDown,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Server,
  CircleHelp,
  Trash2,
  TriangleAlert,
  Upload,
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
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  DiscoveryPanel,
  useDiscovery,
} from '@/app/(app)/_components/discovery';
import { Favicon } from '@/app/(app)/_components/favicon';
import { cn } from '@/lib/utils';
import { normalizeUrl } from '@/lib/url';
import { api } from '@/trpc/client';
import Link from 'next/link';
import { parse as parseYaml } from 'yaml';
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

const OPENAPI_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;
type OpenApiMethod = Uppercase<(typeof OPENAPI_METHODS)[number]>;

interface OpenApiImportResource {
  url: string;
  method: OpenApiMethod;
  label: string;
}

interface ManualRegistrationTarget {
  id: string;
  url: string;
  method?: OpenApiMethod;
  label?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseOpenApiDocument(input: string): Record<string, unknown> {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new Error('Paste an OpenAPI document first.');
  }

  const parsed: unknown =
    trimmed.startsWith('{') || trimmed.startsWith('[')
      ? JSON.parse(trimmed)
      : parseYaml(trimmed);

  if (!isRecord(parsed)) {
    throw new Error('OpenAPI document must be an object.');
  }

  if (!('openapi' in parsed) && !('swagger' in parsed)) {
    throw new Error('Document is missing an openapi or swagger version field.');
  }

  return parsed;
}

function resolveOpenApiServer(
  document: Record<string, unknown>,
  fallbackBaseUrl: string | null
): string {
  const servers = Array.isArray(document.servers) ? document.servers : [];
  const serverUrl = servers
    .map(server => (isRecord(server) ? server.url : undefined))
    .find((value): value is string => typeof value === 'string');

  const rawBaseUrl =
    serverUrl ??
    resolveSwaggerServer(document, fallbackBaseUrl) ??
    fallbackBaseUrl;
  if (!rawBaseUrl) {
    throw new Error('OpenAPI document needs an absolute server URL.');
  }

  try {
    return new URL(rawBaseUrl, fallbackBaseUrl ?? undefined)
      .toString()
      .replace(/\/$/, '');
  } catch {
    throw new Error('OpenAPI server URL is invalid.');
  }
}

function resolveSwaggerServer(
  document: Record<string, unknown>,
  fallbackBaseUrl: string | null
): string | null {
  if (typeof document.swagger !== 'string') {
    return null;
  }

  const host = typeof document.host === 'string' ? document.host : null;
  if (!host) {
    return null;
  }

  const schemes = Array.isArray(document.schemes) ? document.schemes : [];
  let fallbackScheme = 'https';
  if (fallbackBaseUrl) {
    try {
      fallbackScheme = new URL(fallbackBaseUrl).protocol.replace(/:$/, '');
    } catch {
      fallbackScheme = 'https';
    }
  }
  const scheme =
    schemes.find((value): value is string => typeof value === 'string') ??
    fallbackScheme;
  const basePath =
    typeof document.basePath === 'string' && document.basePath.length > 0
      ? document.basePath
      : '';
  const normalizedBasePath = basePath.startsWith('/')
    ? basePath
    : `/${basePath}`;

  return `${scheme}://${host}${normalizedBasePath}`.replace(/\/$/, '');
}

function operationHasX402Metadata(operation: Record<string, unknown>): boolean {
  if ('x-payment-info' in operation) {
    return true;
  }

  const responses = operation.responses;
  return isRecord(responses) && '402' in responses;
}

function buildOpenApiResourceUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function parseOpenApiResources(
  specText: string,
  fallbackBaseUrl: string | null
): { baseUrl: string; resources: OpenApiImportResource[] } {
  const document = parseOpenApiDocument(specText);
  const baseUrl = resolveOpenApiServer(document, fallbackBaseUrl);
  const paths = document.paths;

  if (!isRecord(paths)) {
    throw new Error('OpenAPI document has no paths object.');
  }

  const resources: OpenApiImportResource[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) continue;

    for (const method of OPENAPI_METHODS) {
      const operation = pathItem[method];
      if (!isRecord(operation) || !operationHasX402Metadata(operation)) {
        continue;
      }

      const url = buildOpenApiResourceUrl(baseUrl, path);
      const summary =
        typeof operation.summary === 'string' ? operation.summary : undefined;
      resources.push({
        url,
        method: method.toUpperCase() as OpenApiMethod,
        label: summary ?? path,
      });
    }
  }

  if (resources.length === 0) {
    throw new Error('No x402 operations found in this OpenAPI document.');
  }

  return {
    baseUrl,
    resources: Array.from(
      new Map(
        resources.map(resource => [getOpenApiResourceKey(resource), resource])
      ).values()
    ),
  };
}

function getOpenApiResourceKey(resource: OpenApiImportResource): string {
  return `${resource.method} ${normalizeUrl(resource.url)}`;
}

function createManualTarget(
  url: string,
  method?: OpenApiMethod,
  label?: string
): ManualRegistrationTarget {
  const normalizedUrl = normalizeUrl(url);
  return {
    id: method ? `${method} ${normalizedUrl}` : normalizedUrl,
    url: normalizedUrl,
    method,
    label,
  };
}

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
  const [headers, setHeaders] = useState<{ name: string; value: string }[]>([]);
  const [manualUrls, setManualUrls] = useState<ManualRegistrationTarget[]>([]);
  const [manualListError, setManualListError] = useState<string | null>(null);
  const [manualProgress, setManualProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isRegisteringManual, setIsRegisteringManual] = useState(false);
  const [manualResult, setManualResult] =
    useState<ManualRegistrationResult | null>(null);
  const [openApiSpec, setOpenApiSpec] = useState('');
  const [openApiBaseUrl, setOpenApiBaseUrl] = useState('');
  const [openApiError, setOpenApiError] = useState<string | null>(null);
  const [openApiResources, setOpenApiResources] = useState<
    OpenApiImportResource[]
  >([]);

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
    () =>
      manualUrls.length > 0 ? safeGetOrigin(manualUrls[0]?.url ?? '') : null,
    [manualUrls]
  );

  const hasDiscoveryResources =
    discoveryFound && actualDiscoveredResources.length > 0;
  const shouldUseDiscoveryRegistration =
    hasDiscoveryResources && manualUrls.length === 0;

  const canUseManualMode = isValidUrl && !isOriginOnly;
  const currentUrlAlreadyInManualList = manualUrls.some(
    target => target.id === normalizedUrl
  );
  const canAddCurrentUrl =
    canUseManualMode &&
    !currentUrlAlreadyInManualList &&
    (!queueOrigin || queueOrigin === urlOrigin);

  const manualTargets: ManualRegistrationTarget[] =
    manualUrls.length > 0
      ? manualUrls
      : canUseManualMode
        ? [createManualTarget(normalizedUrl)]
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
    setOpenApiError(null);
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
      setManualUrls(current => [...current, createManualTarget(normalizedUrl)]);
    }

    setManualListError(null);
    setManualResult(null);
    setManualProgress(null);
  };

  const handleRemoveManualUrl = (targetId: string) => {
    setManualUrls(current => current.filter(item => item.id !== targetId));
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
    setOpenApiSpec('');
    setOpenApiBaseUrl('');
    setOpenApiError(null);
    setOpenApiResources([]);
    setIsRegisteringManual(false);
    registerMutation.reset();
    resetBulk();
  };

  const handleOpenApiFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setOpenApiSpec(await file.text());
    setOpenApiError(null);
  };

  const handleImportOpenApiSpec = () => {
    const explicitBaseUrl = openApiBaseUrl.trim();
    const fallbackBaseUrl =
      explicitBaseUrl.length > 0
        ? explicitBaseUrl
        : (urlOrigin ?? safeGetOrigin(url));

    try {
      const parsed = parseOpenApiResources(openApiSpec, fallbackBaseUrl);
      const resources = parsed.resources.map(resource =>
        createManualTarget(resource.url, resource.method, resource.label)
      );
      setManualUrls(resources);
      setOpenApiResources(parsed.resources);
      setUrl(parsed.baseUrl);
      setManualResult(null);
      setManualProgress(null);
      setManualListError(null);
      setOpenApiError(null);
      resetBulk();
    } catch (error) {
      setOpenApiResources([]);
      setOpenApiError(
        error instanceof Error ? error.message : 'Unable to parse OpenAPI spec.'
      );
    }
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

  const runManualRegistration = async (targets: ManualRegistrationTarget[]) => {
    if (targets.length === 0 || isRegisteringManual) {
      return;
    }

    resetStateForNewRun();
    setIsRegisteringManual(true);

    let registered = 0;
    let originId: string | undefined;
    const failedDetails: { url: string; error: string; status?: number }[] = [];

    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index];
      if (!target) continue;
      setManualProgress({ current: index + 1, total: targets.length });

      try {
        const result = await registerMutation.mutateAsync({
          url: target.url,
          headers: requestHeaders,
          method: target.method,
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
          url: target.url,
          error: getErrorMessageFromRegisterResult(result),
        });
      } catch (error) {
        failedDetails.push({
          url: target.url,
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
      origin: safeGetOrigin(targets[0]?.url ?? ''),
    });

    setIsRegisteringManual(false);
  };

  const handleRegisterCurrentUrlOnly = async () => {
    if (!canUseManualMode || isRegisteringManual) {
      return;
    }

    await runManualRegistration([createManualTarget(normalizedUrl)]);
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
              <CardDescription>
                Checking discovery and endpoint data...
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      );
    }

    if (shouldUseDiscoveryRegistration) {
      const previewResources = actualDiscoveredResources.slice(0, 8);
      const hiddenCount =
        actualDiscoveredResources.length - previewResources.length;

      return (
        <Card>
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            {preview?.favicon ? (
              <Favicon
                url={preview.favicon}
                className="size-10 rounded-md border bg-background shrink-0"
              />
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative shrink-0 cursor-help">
                      <Favicon
                        url={null}
                        className="size-10 rounded-md border bg-background"
                      />
                      <CircleHelp className="absolute -right-1.5 -top-1.5 size-3.5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    Add a favicon to help your server stand out
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div className="min-w-0">
              <CardTitle className="text-base truncate">
                {preview?.title ?? urlOrigin ?? 'Discovered Server'}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {preview?.description ??
                  `Found ${actualDiscoveredResources.length} resource${actualDiscoveredResources.length === 1 ? '' : 's'} via .well-known/x402.`}
              </CardDescription>
            </div>
          </CardHeader>
          {!preview?.favicon && (
            <div className="border-t px-6 py-2.5 flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
              <TriangleAlert className="size-3.5 shrink-0" />
              <p>
                To configure a favicon, serve{' '}
                <code className="font-mono">/favicon.ico</code>,{' '}
                <code className="font-mono">.png</code>, or{' '}
                <code className="font-mono">.svg</code> at the root of your
                server, or include a{' '}
                <code className="font-mono">{'<link rel="icon">'}</code> tag.
                This can be updated later by re-registering.
              </p>
            </div>
          )}
          <CardContent className="border-t pt-4">
            <ul className="space-y-1 text-xs text-muted-foreground">
              {previewResources.map(resource => (
                <li key={resource} className="font-mono truncate">
                  {toPathLabel(resource)}
                </li>
              ))}
              {hiddenCount > 0 && (
                <li className="text-muted-foreground/70">
                  + {hiddenCount} more
                </li>
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
              <CardTitle className="text-base">
                No Discovery Document Found
              </CardTitle>
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
              No discovery resources found for this origin. You can still
              register URLs directly.
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
              {getPrimaryProbeError(currentManualFailed)}
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
            Enter a server URL. If discovery is available, we&apos;ll register
            everything. If not, you can add endpoint URLs manually.
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
              {!shouldUseDiscoveryRegistration && (
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

          <div className="rounded-md border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <FileText className="size-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-1">
                <Label>OpenAPI Spec</Label>
                <p className="text-xs text-muted-foreground">
                  Paste or upload a JSON/YAML spec to queue x402 operations for
                  registration.
                </p>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
              <Input
                type="text"
                placeholder="Base URL if the spec uses relative servers"
                value={openApiBaseUrl}
                onChange={event => setOpenApiBaseUrl(event.target.value)}
              />
              <Label className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted cursor-pointer">
                <Upload className="size-4" />
                Upload
                <Input
                  type="file"
                  accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml,text/x-yaml"
                  onChange={event => {
                    void handleOpenApiFile(event);
                  }}
                  className="sr-only"
                />
              </Label>
            </div>
            <Textarea
              value={openApiSpec}
              onChange={event => {
                setOpenApiSpec(event.target.value);
                setOpenApiError(null);
              }}
              placeholder={
                'openapi: 3.1.0\nservers:\n  - url: https://api.example.com\npaths: ...'
              }
              className="min-h-36 font-mono text-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleImportOpenApiSpec}
                disabled={openApiSpec.trim().length === 0}
              >
                Parse OpenAPI Spec
              </Button>
              {openApiResources.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Queued {openApiResources.length} x402 operation
                  {openApiResources.length === 1 ? '' : 's'}.
                </p>
              )}
            </div>
            {openApiError && (
              <p className="text-xs text-red-600">{openApiError}</p>
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
                    onClick={() =>
                      setHeaders(current => [
                        ...current,
                        { name: '', value: '' },
                      ])
                    }
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
            </CollapsibleContent>
          </Collapsible>

          {manualUrls.length > 0 && !shouldUseDiscoveryRegistration && (
            <div className="border rounded-md p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Manual URLs ({manualUrls.length})
              </p>
              <ul className="space-y-1">
                {manualUrls.map(item => (
                  <li key={item.id} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <code className="font-mono break-all">{item.url}</code>
                      {item.method ? (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {item.method} {item.label}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveManualUrl(item.id)}
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
          {shouldUseDiscoveryRegistration ? (
            <>
              <Button
                variant="turbo"
                disabled={isRegisteringAll || isRegisteringManual}
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
              <Button
                variant="outline"
                disabled={
                  !canUseManualMode || isRegisteringAll || isRegisteringManual
                }
                onClick={() => {
                  void handleRegisterCurrentUrlOnly();
                }}
              >
                {isRegisteringManual ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {manualProgress
                      ? `Checking ${manualProgress.current}/${manualProgress.total} resources`
                      : 'Registering...'}
                  </>
                ) : (
                  'Register This URL Only'
                )}
              </Button>
            </>
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

      {!activeBulkResult &&
      !isBatchTestLoading &&
      failedResources.length > 0 ? (
        <details className="border rounded-md group">
          <summary className="p-3 cursor-pointer hover:bg-muted/50 font-medium text-sm flex items-center gap-2">
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            More Info ({failedResources.length} failed resource
            {failedResources.length === 1 ? '' : 's'})
          </summary>
          <div className="p-4 pt-2 border-t space-y-2 max-h-[360px] overflow-y-auto">
            {failedResources.map((failed, idx) => (
              <div
                key={`${failed.url}-${idx}`}
                className="p-3 bg-muted/50 rounded border text-xs space-y-1"
              >
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0">URL:</span>
                  <span className="font-mono break-all">{failed.url}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0">Error:</span>
                  <span className="text-red-600 wrap-break-word">
                    {getPrimaryProbeError(failed)}
                  </span>
                </div>
                {Array.isArray(failed.issues) && failed.issues.length > 0 && (
                  <div className="pt-1">
                    <p className="text-muted-foreground mb-1">
                      Validation details:
                    </p>
                    <ul className="space-y-1 list-disc list-inside">
                      {failed.issues.map((issue, i) => (
                        <li
                          key={i}
                          className="text-red-600 font-mono text-[10px]"
                        >
                          {issue.code}: {issue.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {activeBulkResult && activeSummaryOrigin ? (
        <DiscoveryPanel
          origin={activeSummaryOrigin}
          isLoading={false}
          found={shouldUseDiscoveryRegistration}
          source={discoverySource}
          resources={[]}
          resourceCount={0}
          isRegisteringAll={false}
          bulkResult={activeBulkResult}
        />
      ) : null}

      {activeBulkResult?.originId ? (
        <div className="flex gap-2">
          <Link
            href={`/server/${activeBulkResult.originId}`}
            className="flex-1"
          >
            <Button variant="outline" className="w-full">
              View Server
            </Button>
          </Link>
        </div>
      ) : null}

      {bulkError && <p className={cn('text-sm text-red-600')}>{bulkError}</p>}

      {registerMutation.error && (
        <p className={cn('text-sm text-red-600')}>
          {registerMutation.error.message}
        </p>
      )}
    </div>
  );
};
