'use client';

import { useState } from 'react';
import { AlertTriangle, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface RegistrationResult {
  url: string;
  method: string;
  operationId?: string;
  summary?: string;
  success: boolean;
  result?: any;
  error?: string;
}

interface OpenAPIResult {
  success: boolean;
  dryRun?: boolean;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  totalEndpoints: number;
  registered?: number;
  failed?: number;
  results?: RegistrationResult[];
  resources?: any[];
}

export const OpenAPIUploadForm = () => {
  const [baseUrl, setBaseUrl] = useState('');
  const [spec, setSpec] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<OpenAPIResult | null>(null);

  const handleSubmit = async () => {
    setIsPending(true);
    try {
      const response = await fetch('/api/v1/resources/register-from-openapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, spec, dryRun }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.message || 'Failed to process OpenAPI spec');
        setResult(null);
        return;
      }

      setResult(data);

      if (dryRun) {
        toast.success(`Found ${data.totalEndpoints} endpoints`);
      } else {
        toast.success(
          `Registered ${data.registered} of ${data.totalEndpoints} endpoints`
        );
      }
    } catch (error) {
      toast.error('Failed to process OpenAPI spec');
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  const handleReset = () => {
    setBaseUrl('');
    setSpec('');
    setDryRun(true);
    setResult(null);
  };

  const isValidUrl = baseUrl.trim() !== '' && baseUrl.startsWith('http');
  const isValidSpec = spec.trim() !== '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {result ? 'OpenAPI Spec Processed' : 'Register from OpenAPI Spec'}
        </CardTitle>
        <CardDescription>
          {result
            ? `Processed ${result.totalEndpoints} endpoints from your OpenAPI specification.`
            : 'Upload or paste an OpenAPI 3.x specification to register multiple resources at once.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="flex flex-col gap-4">
            {/* API Info */}
            {result.info && (
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-semibold">{result.info.title}</h3>
                {result.info.version && (
                  <p className="text-sm text-muted-foreground">
                    Version: {result.info.version}
                  </p>
                )}
                {result.info.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {result.info.description}
                  </p>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="flex gap-4 justify-around bg-muted p-4 rounded-md">
              <div className="text-center">
                <p className="text-2xl font-bold">{result.totalEndpoints}</p>
                <p className="text-sm text-muted-foreground">
                  Total Endpoints
                </p>
              </div>
              {!result.dryRun && (
                <>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {result.registered}
                    </p>
                    <p className="text-sm text-muted-foreground">Registered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {result.failed}
                    </p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </>
              )}
            </div>

            {/* Preview or Results */}
            {result.dryRun && result.resources && (
              <div className="border rounded-md p-4">
                <h4 className="font-semibold mb-2">Preview (Dry Run)</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  These endpoints will be registered when you submit:
                </p>
                <div className="max-h-64 overflow-auto space-y-2">
                  {result.resources.slice(0, 10).map((resource, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-muted rounded text-xs"
                    >
                      <span className="font-mono font-semibold text-primary">
                        {resource.method}
                      </span>
                      <span className="font-mono flex-1 truncate">
                        {resource.url}
                      </span>
                    </div>
                  ))}
                  {result.resources.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center">
                      ... and {result.resources.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Registration Results */}
            {!result.dryRun && result.results && (
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Registration Results</h4>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle>Detailed Results</DialogTitle>
                        <DialogDescription>
                          Registration results for all endpoints
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        {result.results.map((res, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-3 border rounded"
                          >
                            {res.success ? (
                              <CheckCircle2 className="size-4 text-green-600 mt-0.5 shrink-0" />
                            ) : (
                              <AlertTriangle className="size-4 text-red-600 mt-0.5 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex gap-2 items-center mb-1">
                                <span className="font-mono font-semibold text-xs text-primary">
                                  {res.method}
                                </span>
                                <span className="font-mono text-xs truncate">
                                  {res.url}
                                </span>
                              </div>
                              {res.summary && (
                                <p className="text-xs text-muted-foreground">
                                  {res.summary}
                                </p>
                              )}
                              {res.error && (
                                <p className="text-xs text-red-600 mt-1">
                                  {res.error}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {result.results
                    .filter(r => !r.success)
                    .slice(0, 5)
                    .map((res, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-red-600/10 border border-red-600/20 rounded text-xs"
                      >
                        <AlertTriangle className="size-4 text-red-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono truncate">{res.url}</div>
                          {res.error && (
                            <div className="text-muted-foreground">
                              {res.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {result.dryRun && (
              <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-md p-3 flex items-start gap-2">
                <AlertTriangle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Dry Run Mode</p>
                  <p className="text-xs text-muted-foreground">
                    Uncheck "Dry Run" and submit again to actually register
                    these resources.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label>Base URL</Label>
              <Input
                type="url"
                placeholder="https://api.example.com"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The base URL where your API is hosted
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Label>OpenAPI Specification</Label>
              <Textarea
                placeholder='Paste your OpenAPI 3.x spec here (JSON or YAML)...'
                value={spec}
                onChange={e => setSpec(e.target.value)}
                className="font-mono text-xs min-h-[300px]"
              />
              <p className="text-xs text-muted-foreground">
                Supports OpenAPI 3.0 and 3.1 in JSON or YAML format
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dryRun"
                checked={dryRun}
                onCheckedChange={checked => setDryRun(checked as boolean)}
              />
              <label
                htmlFor="dryRun"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Dry run (preview endpoints without registering)
              </label>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {result ? (
          <>
            {result.dryRun ? (
              <>
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="turbo"
                  onClick={() => {
                    setDryRun(false);
                    setResult(null);
                  }}
                  className="flex-1"
                >
                  Register All Endpoints
                </Button>
              </>
            ) : (
              <Button variant="turbo" onClick={handleReset} className="w-full">
                Register Another
              </Button>
            )}
          </>
        ) : (
          <Button
            variant="turbo"
            disabled={isPending || !isValidUrl || !isValidSpec}
            onClick={handleSubmit}
            className="w-full"
          >
            {isPending ? 'Processing...' : dryRun ? 'Preview Endpoints' : 'Register All'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};