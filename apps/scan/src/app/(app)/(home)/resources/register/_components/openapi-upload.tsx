'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  CheckCircle2,
  ChevronDown,
  FileUp,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { Dropzone } from '@/components/ui/dropzone';

import { api } from '@/trpc/client';

type DryRunEndpoint = {
  method: string;
  path: string;
  url: string;
  summary: string | undefined;
  description: string | undefined;
  parameterCount: number;
};

type RegisterResult = {
  url: string;
  method: string;
  path: string;
  success: boolean;
  error?: string;
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PATCH:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function OpenApiUpload() {
  const [specText, setSpecText] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewEndpoints, setPreviewEndpoints] = useState<
    DryRunEndpoint[] | null
  >(null);
  const [previewMeta, setPreviewMeta] = useState<{
    title?: string;
    version?: string;
    description?: string;
    baseUrl?: string;
  } | null>(null);
  const [registerResults, setRegisterResults] = useState<
    RegisterResult[] | null
  >(null);

  const registerMutation =
    api.public.resources.registerFromOpenApi.useMutation();

  const isParsing = registerMutation.isPending && !registerResults;
  const isRegistering = registerMutation.isPending && previewEndpoints !== null;

  const hasSpec = specText.trim().length > 0;

  const specInput = useMemo(() => {
    if (!hasSpec) return null;
    const trimmed = specText.trim();
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      return trimmed;
    }
  }, [specText, hasSpec]);

  const handleFileUpload = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = event => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          setSpecText(content);
          setParseError(null);
          setPreviewEndpoints(null);
          setPreviewMeta(null);
          setRegisterResults(null);
          registerMutation.reset();
        }
      };
      reader.onerror = () => {
        setParseError('Failed to read the uploaded file. Please try again.');
      };
      reader.readAsText(file);
    },
    [registerMutation]
  );

  const handleParseSpec = async () => {
    if (!specInput) return;

    setParseError(null);
    setPreviewEndpoints(null);
    setPreviewMeta(null);
    setRegisterResults(null);

    try {
      const result = await registerMutation.mutateAsync({
        spec: specInput,
        baseUrl: baseUrl || undefined,
        dryRun: true,
      });

      if (result.dryRun) {
        setPreviewEndpoints(result.endpoints);
        setPreviewMeta({
          title: result.title ?? undefined,
          version: result.version ?? undefined,
          description: result.description ?? undefined,
          baseUrl: result.baseUrl ?? undefined,
        });
      }
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : 'Failed to parse spec'
      );
    }
  };

  const handleRegisterAll = async () => {
    if (!specInput || !previewEndpoints) return;

    setRegisterResults(null);

    try {
      const result = await registerMutation.mutateAsync({
        spec: specInput,
        baseUrl: baseUrl || undefined,
        dryRun: false,
      });

      if (!result.dryRun) {
        setRegisterResults(result.results);
      }
    } catch (error) {
      setParseError(
        error instanceof Error ? error.message : 'Registration failed'
      );
    }
  };

  const handleReset = () => {
    setSpecText('');
    setBaseUrl('');
    setParseError(null);
    setPreviewEndpoints(null);
    setPreviewMeta(null);
    setRegisterResults(null);
    registerMutation.reset();
  };

  const registeredCount = registerResults?.filter(r => r.success).length ?? 0;
  const failedCount = registerResults?.filter(r => !r.success).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="size-5" />
          Import from OpenAPI Spec
        </CardTitle>
        <CardDescription>
          Upload or paste an OpenAPI 3.x / Swagger 2.x specification to register
          multiple endpoints at once.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* File upload */}
        <div className="space-y-1">
          <Label>Upload spec file</Label>
          <Dropzone
            accept={{
              'application/json': ['.json'],
            }}
            maxFiles={1}
            onDrop={handleFileUpload}
            className="w-full h-auto py-6 flex-col gap-2"
          >
            <Upload className="size-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Drop a .json file, or click to browse
            </span>
          </Dropzone>
        </div>

        {/* Paste area */}
        <div className="space-y-1">
          <Label>Or paste spec content</Label>
          <Textarea
            placeholder='{"openapi": "3.1.0", "info": {...}, "paths": {...}}'
            rows={8}
            value={specText}
            onChange={e => {
              setSpecText(e.target.value);
              setParseError(null);
              setPreviewEndpoints(null);
              setPreviewMeta(null);
              setRegisterResults(null);
            }}
            className="font-mono text-xs"
          />
        </div>

        {/* Base URL override */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="size-fit p-0 text-xs text-muted-foreground/70 hover:text-muted-foreground"
            >
              Base URL Override
              <ChevronDown className="size-3 ml-1" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Input
              type="url"
              placeholder="https://api.example.com (optional — auto-detected from spec)"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Error display */}
        {parseError && (
          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md p-3">
            <XCircle className="size-4 shrink-0 mt-0.5" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Preview endpoints */}
        {previewEndpoints && previewMeta && (
          <div className="space-y-3">
            <div className="border rounded-md p-3 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {previewMeta.title ?? 'Untitled API'}
                </p>
                {previewMeta.version && (
                  <Badge variant="secondary" className="text-xs">
                    v{previewMeta.version}
                  </Badge>
                )}
              </div>
              {previewMeta.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {previewMeta.description}
                </p>
              )}
              {previewMeta.baseUrl && (
                <p className="text-xs text-muted-foreground font-mono">
                  {previewMeta.baseUrl}
                </p>
              )}
            </div>

            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {previewEndpoints.length} endpoint
              {previewEndpoints.length !== 1 ? 's' : ''} found
            </p>

            <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
              {previewEndpoints.map((ep, i) => (
                <div key={i} className="px-3 py-2 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono px-1.5 py-0 shrink-0 ${METHOD_COLORS[ep.method] ?? ''}`}
                  >
                    {ep.method}
                  </Badge>
                  <code className="text-xs font-mono truncate flex-1">
                    {ep.path}
                  </code>
                  {(ep.summary ?? ep.description) && (
                    <span className="text-xs text-muted-foreground truncate max-w-48">
                      {ep.summary ?? ep.description}
                    </span>
                  )}
                  {registerResults && (
                    <>
                      {registerResults[i]?.success ? (
                        <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="size-3.5 text-red-600 shrink-0" />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration results summary */}
        {registerResults && (
          <div className="border rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              {failedCount === 0 ? (
                <>
                  <CheckCircle2 className="size-4 text-green-600" />
                  All {registeredCount} endpoint
                  {registeredCount !== 1 ? 's' : ''} registered
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-green-600" />
                  {registeredCount} registered, {failedCount} failed
                </>
              )}
            </div>
            {failedCount > 0 && (
              <div className="space-y-1">
                {registerResults
                  .filter(r => !r.success)
                  .map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400"
                    >
                      <XCircle className="size-3 shrink-0 mt-0.5" />
                      <div>
                        <code className="font-mono">
                          {r.method} {r.path}
                        </code>
                        {r.error && (
                          <span className="text-muted-foreground ml-1">
                            — {r.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!previewEndpoints ? (
          <Button
            variant="turbo"
            disabled={!hasSpec || isParsing}
            onClick={() => void handleParseSpec()}
          >
            {isParsing ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Parsing...
              </>
            ) : (
              'Parse Spec'
            )}
          </Button>
        ) : !registerResults ? (
          <Button
            variant="turbo"
            disabled={isRegistering}
            onClick={() => void handleRegisterAll()}
          >
            {isRegistering ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Registering {previewEndpoints.length} endpoints...
              </>
            ) : (
              `Register All (${previewEndpoints.length} endpoints)`
            )}
          </Button>
        ) : null}

        {(hasSpec || previewEndpoints || registerResults) && (
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
