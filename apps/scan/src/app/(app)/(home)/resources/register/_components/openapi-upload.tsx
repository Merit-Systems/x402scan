'use client';

import { useState, useCallback, useRef } from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  FileCode,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';

import { toast } from 'sonner';

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
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

import { api } from '@/trpc/client';

type DryRunEndpoint = {
  url: string;
  method: string;
  path: string;
  description: string | null;
  operationId: string | null;
  hasQueryParams: boolean;
  hasBodyFields: boolean;
  hasResponseSchema: boolean;
};

type RegisteredEndpoint = {
  url: string;
  method: string;
  path: string;
  description: string | null;
};

type FailedEndpoint = {
  url: string;
  method: string;
  path: string;
  description: string | null;
  error: string;
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  POST: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  PUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  PATCH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export const OpenAPIUpload = () => {
  const [specContent, setSpecContent] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showBaseUrl, setShowBaseUrl] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<{
    title: string | null;
    description: string | null;
    version: string | null;
    baseUrl: string;
    endpointCount: number;
    endpoints: DryRunEndpoint[];
  } | null>(null);
  const [registerResult, setRegisterResult] = useState<{
    registered: number;
    failed: number;
    total: number;
    successfulEndpoints: RegisteredEndpoint[];
    failedEndpoints: FailedEndpoint[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: parseSpec, isPending: isParsing } =
    api.public.resources.registerFromOpenAPISpec.useMutation({
      onSuccess: data => {
        if (!data.success) {
          toast.error(data.error ?? 'Failed to parse spec');
          return;
        }
        if (data.dryRun) {
          setDryRunResult({
            title: data.title,
            description: data.description,
            version: data.version,
            baseUrl: data.baseUrl,
            endpointCount: data.endpointCount,
            endpoints: data.endpoints,
          });
          toast.success(
            `Found ${data.endpointCount} endpoint${data.endpointCount === 1 ? '' : 's'}`
          );
        }
      },
      onError: err => {
        toast.error(err.message ?? 'Failed to parse spec');
      },
    });

  const { mutate: registerAll, isPending: isRegistering } =
    api.public.resources.registerFromOpenAPISpec.useMutation({
      onSuccess: data => {
        if (!data.success) {
          toast.error(data.error ?? 'Registration failed');
          return;
        }
        if (!data.dryRun) {
          setRegisterResult({
            registered: data.registered,
            failed: data.failed,
            total: data.total,
            successfulEndpoints: data.successfulEndpoints,
            failedEndpoints: data.failedEndpoints,
          });
          if (data.registered > 0) {
            toast.success(
              `Registered ${data.registered} of ${data.total} endpoint${data.total === 1 ? '' : 's'}`
            );
          } else {
            toast.error(
              'No endpoints could be registered. They may not return 402 responses.'
            );
          }
        }
      },
      onError: err => {
        toast.error(err.message ?? 'Registration failed');
      },
    });

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result as string;
        setSpecContent(content);
        setDryRunResult(null);
        setRegisterResult(null);
      };
      reader.readAsText(file);
    },
    []
  );

  const handleParse = () => {
    if (!specContent.trim()) {
      toast.error('Please paste or upload an OpenAPI spec');
      return;
    }
    setDryRunResult(null);
    setRegisterResult(null);
    parseSpec({
      spec: specContent,
      baseUrl: baseUrl || undefined,
      dryRun: true,
    });
  };

  const handleRegister = () => {
    if (!specContent.trim()) return;
    registerAll({
      spec: specContent,
      baseUrl: baseUrl || undefined,
      dryRun: false,
    });
  };

  const handleReset = () => {
    setSpecContent('');
    setBaseUrl('');
    setDryRunResult(null);
    setRegisterResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
          <FileCode className="size-5" />
          {registerResult
            ? 'Registration Complete'
            : dryRunResult
              ? 'Spec Preview'
              : 'Import from OpenAPI Spec'}
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          {registerResult
            ? `Registered ${registerResult.registered} of ${registerResult.total} endpoints.`
            : dryRunResult
              ? `${dryRunResult.endpointCount} endpoint${dryRunResult.endpointCount === 1 ? '' : 's'} found. Review and register them below.`
              : 'Upload or paste an OpenAPI specification file (JSON or YAML) to automatically register all your API endpoints as x402 resources.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {registerResult ? (
          <div className="flex flex-col gap-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{registerResult.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="border rounded-lg p-3 text-center border-green-500/30 bg-green-500/5">
                <p className="text-2xl font-bold text-green-600">
                  {registerResult.registered}
                </p>
                <p className="text-xs text-muted-foreground">Registered</p>
              </div>
              <div className="border rounded-lg p-3 text-center border-red-500/30 bg-red-500/5">
                <p className="text-2xl font-bold text-red-600">
                  {registerResult.failed}
                </p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>

            <Accordion type="multiple" className="w-full">
              {registerResult.successfulEndpoints.length > 0 && (
                <AccordionItem value="successful">
                  <AccordionTrigger className="py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-green-600" />
                      <span className="font-semibold">
                        Registered Endpoints
                      </span>
                      <Badge variant="secondary">
                        {registerResult.successfulEndpoints.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {registerResult.successfulEndpoints.map((ep, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
                        >
                          <Badge
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0',
                              METHOD_COLORS[ep.method]
                            )}
                            variant="outline"
                          >
                            {ep.method}
                          </Badge>
                          <span className="font-mono text-xs truncate">
                            {ep.path}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {registerResult.failedEndpoints.length > 0 && (
                <AccordionItem value="failed">
                  <AccordionTrigger className="py-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="size-4 text-red-600" />
                      <span className="font-semibold">Failed Endpoints</span>
                      <Badge variant="secondary">
                        {registerResult.failedEndpoints.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {registerResult.failedEndpoints.map((ep, i) => (
                        <div
                          key={i}
                          className="p-2 rounded-md bg-red-500/5 border border-red-500/20"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <Badge
                              className={cn(
                                'text-[10px] font-mono px-1.5 py-0',
                                METHOD_COLORS[ep.method]
                              )}
                              variant="outline"
                            >
                              {ep.method}
                            </Badge>
                            <span className="font-mono text-xs truncate">
                              {ep.path}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ep.error}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        ) : dryRunResult ? (
          <div className="flex flex-col gap-4">
            {/* Spec info */}
            {(dryRunResult.title || dryRunResult.description) && (
              <div className="border rounded-lg p-4 bg-muted/30">
                {dryRunResult.title && (
                  <h3 className="font-semibold">{dryRunResult.title}</h3>
                )}
                {dryRunResult.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {dryRunResult.description}
                  </p>
                )}
                {dryRunResult.version && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    v{dryRunResult.version}
                  </Badge>
                )}
                {dryRunResult.baseUrl && (
                  <p className="text-xs text-muted-foreground mt-2 font-mono">
                    Base: {dryRunResult.baseUrl}
                  </p>
                )}
              </div>
            )}

            {/* Endpoint list */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <p className="text-sm font-medium">
                  {dryRunResult.endpointCount} Endpoint
                  {dryRunResult.endpointCount === 1 ? '' : 's'} Found
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y">
                {dryRunResult.endpoints.map((ep, i) => (
                  <div key={i} className="px-4 py-2.5 hover:bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          'text-[10px] font-mono px-1.5 py-0 shrink-0',
                          METHOD_COLORS[ep.method]
                        )}
                        variant="outline"
                      >
                        {ep.method}
                      </Badge>
                      <span className="font-mono text-sm truncate">
                        {ep.path}
                      </span>
                      <div className="flex items-center gap-1 ml-auto shrink-0">
                        {ep.hasQueryParams && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            query
                          </Badge>
                        )}
                        {ep.hasBodyFields && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            body
                          </Badge>
                        )}
                      </div>
                    </div>
                    {ep.description && (
                      <p className="text-xs text-muted-foreground mt-1 ml-14">
                        {ep.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-md">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Only endpoints that respond with a 402 status code will be
                registered. Endpoints without x402 payment requirements will be
                skipped.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* File upload */}
            <div className="flex flex-col gap-2">
              <Label>Upload spec file</Label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-4 mr-2" />
                  Choose File (.json, .yaml, .yml)
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Paste spec */}
            <div className="flex flex-col gap-2">
              <Label>Paste spec content</Label>
              <Textarea
                placeholder='{"openapi": "3.0.0", "info": {...}, "paths": {...}}'
                value={specContent}
                onChange={e => {
                  setSpecContent(e.target.value);
                  setDryRunResult(null);
                  setRegisterResult(null);
                }}
                className="min-h-40 font-mono text-xs"
              />
            </div>

            {/* Base URL override */}
            <Collapsible open={showBaseUrl} onOpenChange={setShowBaseUrl}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="size-fit p-0 w-full md:size-fit text-xs md:text-xs text-muted-foreground/60 hover:text-muted-foreground"
                >
                  Base URL Override
                  <ChevronDown
                    className={cn(
                      'size-3 transition-transform',
                      showBaseUrl && 'rotate-180'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="border p-4 rounded-md mt-2">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs">
                    Base URL (overrides servers in spec)
                  </Label>
                  <Input
                    type="text"
                    placeholder="https://api.example.com"
                    value={baseUrl}
                    onChange={e => setBaseUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    If your spec&apos;s server URL is wrong or missing, provide
                    the correct base URL here.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-2">
        {registerResult ? (
          <Button variant="outline" onClick={handleReset} className="w-full">
            Import Another Spec
          </Button>
        ) : dryRunResult ? (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => {
                setDryRunResult(null);
              }}
              className="flex-1"
            >
              Back to Edit
            </Button>
            <Button
              variant="turbo"
              disabled={isRegistering}
              onClick={handleRegister}
              className="flex-1"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                `Register ${dryRunResult.endpointCount} Endpoint${dryRunResult.endpointCount === 1 ? '' : 's'}`
              )}
            </Button>
          </div>
        ) : (
          <Button
            variant="turbo"
            disabled={isParsing || !specContent.trim()}
            onClick={handleParse}
            className="w-full"
          >
            {isParsing ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Parsing...
              </>
            ) : (
              <>
                <FileCode className="size-4 mr-2" />
                Parse Spec
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
