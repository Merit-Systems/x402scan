'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileJson,
  Loader2,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface OpenApiResource {
  url: string;
  method: string;
  success: boolean;
  error?: string;
}

interface OpenApiRegisterResponse {
  success: boolean;
  registered: number;
  total: number;
  failed: number;
  failedDetails: Array<{ url: string; error: string }>;
  resources: OpenApiResource[];
  error?: string;
}

export const OpenApiRegisterForm = () => {
  const [specText, setSpecText] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [result, setResult] = useState<OpenApiRegisterResponse | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const isValidJson = useMemo(() => {
    if (!specText.trim()) return false;
    try {
      JSON.parse(specText);
      return true;
    } catch {
      return false;
    }
  }, [specText]);

  const previewResources = useMemo(() => {
    if (!isValidJson) return [];
    try {
      const spec = JSON.parse(specText);
      const resources: Array<{ path: string; method: string }> = [];
      const paths = spec.paths ?? {};

      for (const [path, methods] of Object.entries(paths)) {
        if (!methods || typeof methods !== 'object') continue;
        for (const [method, op] of Object.entries(
          methods as Record<string, unknown>
        )) {
          if (method.startsWith('x-') || method === 'parameters') continue;
          const operation = op as Record<string, unknown>;
          const x402 = operation['x-402'] ?? operation['x402'];
          if (x402) {
            resources.push({ path, method: method.toUpperCase() });
          }
        }
      }
      return resources;
    } catch {
      return [];
    }
  }, [isValidJson, specText]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          setSpecText(content);
          setParseError(null);
          setResult(null);
        }
      };
      reader.onerror = () => {
        setParseError('Failed to read file');
      };
      reader.readAsText(file);
    },
    []
  );

  const handleRegister = async () => {
    if (!isValidJson || isRegistering) return;

    setIsRegistering(true);
    setParseError(null);
    setResult(null);

    try {
      const spec = JSON.parse(specText);
      const body: Record<string, unknown> = { spec };
      if (baseUrl.trim()) {
        body.baseUrl = baseUrl.trim();
      }

      const response = await fetch(
        '/api/x402/registry/register-openapi',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setParseError(data.error ?? 'Registration failed');
        return;
      }

      setResult(data as OpenApiRegisterResponse);
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Registration failed'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleReset = () => {
    setSpecText('');
    setBaseUrl('');
    setResult(null);
    setParseError(null);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="size-5" />
            Upload OpenAPI Spec
          </CardTitle>
          <CardDescription>
            Paste or upload an OpenAPI specification with{' '}
            <code className="font-mono text-xs bg-muted px-1 rounded">
              x-402
            </code>{' '}
            extensions to register multiple resources at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="openapi-file">Upload File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="openapi-file"
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileUpload}
                className="file:text-sm file:font-medium"
              />
              <Upload className="size-4 text-muted-foreground shrink-0" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="openapi-spec">Or Paste JSON</Label>
            <textarea
              id="openapi-spec"
              className={cn(
                'w-full h-48 p-3 rounded-md border bg-background font-mono text-xs resize-y',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                specText && !isValidJson && 'border-red-500'
              )}
              placeholder={`{
  "openapi": "3.0.0",
  "paths": {
    "/api/data": {
      "post": {
        "x-402": {
          "enabled": true,
          "price": {
            "amount": "1000",
            "network": "base"
          }
        }
      }
    }
  }
}`}
              value={specText}
              onChange={e => {
                setSpecText(e.target.value);
                setParseError(null);
                setResult(null);
              }}
            />
            {specText && !isValidJson && (
              <p className="text-xs text-red-600">Invalid JSON format</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="base-url">Base URL (optional)</Label>
            <Input
              id="base-url"
              type="text"
              placeholder="https://api.example.com"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Override the{' '}
              <code className="font-mono">servers[0].url</code> in the
              spec. Use this when the spec contains path-only endpoints.
            </p>
          </div>

          {previewResources.length > 0 && (
            <div className="border rounded-md p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Detected x-402 Endpoints ({previewResources.length})
              </p>
              <ul className="space-y-1">
                {previewResources.map(({ path, method }, i) => (
                  <li
                    key={`${method}-${path}-${i}`}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="font-mono text-muted-foreground w-12 shrink-0">
                      {method}
                    </span>
                    <code className="font-mono break-all">{path}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-2">
          <Button
            variant="turbo"
            disabled={!isValidJson || isRegistering}
            onClick={handleRegister}
          >
            {isRegistering ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Registering from OpenAPI spec...
              </>
            ) : previewResources.length > 0 ? (
              `Register ${previewResources.length} Resource${previewResources.length === 1 ? '' : 's'}`
            ) : (
              'Register from OpenAPI Spec'
            )}
          </Button>
          {(specText || result) && (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
        </CardFooter>
      </Card>

      {parseError && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            <XCircle className="size-6 text-red-600 shrink-0" />
            <div>
              <CardTitle className="text-base">Registration Failed</CardTitle>
              <CardDescription>{parseError}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      )}

      {result && (
        <Card
          className={
            result.registered > 0
              ? 'border-green-200 dark:border-green-900'
              : 'border-yellow-200 dark:border-yellow-900'
          }
        >
          <CardHeader className="flex-row items-center gap-3 space-y-0">
            {result.registered > 0 ? (
              <CheckCircle2 className="size-6 text-green-600 shrink-0" />
            ) : (
              <XCircle className="size-6 text-yellow-600 shrink-0" />
            )}
            <div>
              <CardTitle className="text-base">
                {result.registered > 0
                  ? `Registered ${result.registered} of ${result.total} resources`
                  : `Failed to register any resources`}
              </CardTitle>
              <CardDescription>
                {result.failed > 0
                  ? `${result.failed} endpoint${result.failed === 1 ? '' : 's'} failed`
                  : 'All endpoints registered successfully'}
              </CardDescription>
            </div>
          </CardHeader>

          {result.resources.length > 0 && (
            <CardContent className="border-t pt-4">
              <ul className="space-y-1 text-xs">
                {result.resources.map((resource, i) => (
                  <li
                    key={`${resource.method}-${resource.url}-${i}`}
                    className="flex items-start gap-2"
                  >
                    {resource.success ? (
                      <CheckCircle2 className="size-3 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="size-3 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <span className="font-mono">
                        {resource.method} {resource.url}
                      </span>
                      {resource.error && (
                        <p className="text-red-600 mt-0.5">{resource.error}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};
